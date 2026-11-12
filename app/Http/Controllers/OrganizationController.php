<?php

namespace App\Http\Controllers;

use App\Mail\OrganizationInvitationMail;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationUser;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    /**
     * Show organization creation / onboarding wizard.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();
        if (! $user || ! $user->canCreateOrganization()) {
            abort(403, 'Unauthorized. You have reached the maximum organization limit allowed by your subscription plan. Please upgrade your plan to create additional organizations.');
        }

        $plans = SubscriptionPlan::where('is_active', true)->get();

        return Inertia::render('tenant/onboarding', [
            'plans' => $plans,
        ]);
    }

    /**
     * Store a newly created organization.
     */
    public function store(Request $request): RedirectResponse
    {
        $reserved = config('app.reserved_subdomains', []);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:100',
                'alpha_dash',
                'unique:organizations,slug',
                function ($attribute, $value, $fail) use ($reserved) {
                    if (in_array(strtolower($value), $reserved, true)) {
                        $fail("The subdomain '{$value}' is reserved for platform use. Please choose another slug.");
                    }
                },
            ],
            'organization_type' => 'required|string|in:school,academy,coaching_center,online_course_provider',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'timezone' => 'nullable|string|max:50',
            'primary_color' => 'nullable|string|max:25',
            'accent_color' => 'nullable|string|max:25',
            'logo_path' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        if (! $user || ! $user->canCreateOrganization()) {
            abort(403, 'Unauthorized. You have reached the maximum organization limit allowed by your subscription plan. Please upgrade your plan to create additional organizations.');
        }

        $organization = DB::transaction(function () use ($validated, $user) {
            $organization = Organization::create([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['slug']),
                'organization_type' => $validated['organization_type'],
                'email' => $validated['email'] ?? $user->email,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'timezone' => $validated['timezone'] ?? 'UTC',
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            // Attach creator as organization 'owner'
            OrganizationUser::create([
                'organization_id' => $organization->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'status' => 'active',
                'title' => 'Founder & Director',
            ]);

            // Create default current academic year and terms
            $currentYear = (int) date('Y');
            $academicYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => "{$currentYear}-".($currentYear + 1).' Academic Session',
                'start_date' => "{$currentYear}-09-01",
                'end_date' => ($currentYear + 1).'-06-30',
                'is_current' => true,
            ]);

            AcademicTerm::create([
                'organization_id' => $organization->id,
                'academic_year_id' => $academicYear->id,
                'name' => 'Fall Term (First Half)',
                'start_date' => "{$currentYear}-09-01",
                'end_date' => "{$currentYear}-12-31",
                'is_current' => true,
            ]);

            AcademicTerm::create([
                'organization_id' => $organization->id,
                'academic_year_id' => $academicYear->id,
                'name' => 'Spring Term (Second Half)',
                'start_date' => ($currentYear + 1).'-01-01',
                'end_date' => ($currentYear + 1).'-06-30',
                'is_current' => false,
            ]);

            // Attach subscription matching owner's highest active tier or active trial
            $ownerOrgIds = $user->organizations()
                ->wherePivot('role', 'owner')
                ->where('organizations.id', '!=', $organization->id)
                ->pluck('organizations.id');

            $ownerSub = \App\Models\OrganizationSubscription::with('plan')
                ->where(function ($query) use ($user, $ownerOrgIds) {
                    $query->where('user_id', $user->id)
                        ->orWhereIn('organization_id', $ownerOrgIds);
                })
                ->orderByRaw("CASE WHEN status = 'active' THEN 1 WHEN status = 'trialing' THEN 2 ELSE 3 END")
                ->first();

            $plan = $ownerSub?->plan
                ?? SubscriptionPlan::where('slug', 'bronze')->first()
                ?? SubscriptionPlan::first();

            if ($plan) {
                $organization->subscription()->create([
                    'plan_id' => $plan->id,
                    'user_id' => $user->id,
                    'status' => $ownerSub?->status ?? \App\Models\OrganizationSubscription::STATUS_TRIALING,
                    'starts_at' => now(),
                    'trial_ends_at' => $ownerSub?->trial_ends_at ?? now()->addDays((int) config('billing.trial_days', 30)),
                    'ends_at' => $ownerSub?->ends_at,
                    'billing_type' => $ownerSub?->billing_type ?? 'trial',
                ]);
            }

            return $organization;
        });

        // Set session to this new organization
        TenantContext::set($organization);
        $request->session()->put('current_organization_id', $organization->id);

        return redirect()->route('dashboard')->with('success', "Organization {$organization->name} created successfully! You are now the Owner.");
    }

    /**
     * Switch active organization for the current session.
     */
    public function switch(Organization $organization, Request $request): RedirectResponse
    {
        $user = $request->user();

        $isMember = $user->organizations()
            ->where('organizations.id', $organization->id)
            ->where('organizations.status', 'active')
            ->wherePivot('status', 'active')
            ->exists();

        if (! $isMember && ! $user->isSuperAdmin()) {
            abort(403, 'You are not an authorized active member of this organization.');
        }

        TenantContext::set($organization);
        $request->session()->put('current_organization_id', $organization->id);

        return redirect()->route('dashboard')->with('success', "Switched to {$organization->name}.");
    }

    /**
     * Show organization settings.
     */
    public function settings(): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404, 'No active organization found.');
        }

        $this->authorize('update', $organization);

        return Inertia::render('tenant/settings', [
            'organization' => $organization,
        ]);
    }

    /**
     * Update organization settings.
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('update', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'organization_type' => 'required|string|in:school,academy,college,training_institute,other,coaching_center,online_course_provider',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'timezone' => 'nullable|string|max:50',
            'currency' => 'nullable|string|size:3',
            'primary_color' => 'nullable|string|max:25',
            'accent_color' => 'nullable|string|max:25',
            'logo' => 'nullable|file|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            'logo_path' => 'nullable|string|max:500',
        ]);

        if ($request->hasFile('logo')) {
            $oldLogo = $organization->getRawOriginal('logo_path');
            if ($oldLogo && preg_match('#(?:^|/storage/)(logos/[A-Za-z0-9._-]+)$#', $oldLogo, $m)) {
                Storage::disk('public')->delete($m[1]);
            }

            $path = $request->file('logo')->store('logos', 'public');
            $validated['logo_path'] = '/storage/' . ltrim($path, '/');
        }

        if (! empty($validated['currency'])) {
            $validated['currency'] = strtoupper($validated['currency']);
        }

        unset($validated['logo']);

        $organization->update($validated);

        $dispatcher = app(\App\Services\NotificationDispatcher::class);
        $dispatcher->toOrganizationRoles(
            organizationId: $organization->id,
            roles: ['owner', 'admin'],
            category: 'organization_activity',
            title: 'Organization Settings Updated',
            message: "{$request->user()->name} updated settings for {$organization->name}.",
            url: '/organizations/settings',
            icon: 'settings',
            severity: 'info',
            excludeUserId: $request->user()->id,
        );
        $dispatcher->broadcastDomainUpdate($organization->id, 'organization', ['owner', 'admin']);

        return back()->with('success', 'Organization settings updated successfully.');
    }

    /**
     * View organization members and invitations.
     */
    public function members(): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('view', $organization);

        $members = OrganizationUser::with('user')
            ->where('organization_id', $organization->id)
            ->whereIn('role', ['owner', 'admin', 'teacher'])
            ->paginate(15);

        $invitations = OrganizationInvitation::where('organization_id', $organization->id)
            ->whereIn('role', ['admin', 'teacher'])
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->get();

        return Inertia::render('tenant/members', [
            'organization' => $organization,
            'members' => $members,
            'invitations' => $invitations,
        ]);
    }

    /**
     * Send an invitation to join the organization.
     */
    public function invite(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404, 'No active organization found.');
        }

        $this->authorize('manageMembers', $organization);

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'role' => 'required|string|in:admin,teacher',
        ]);

        // Check if user is already an active member of this organization
        $existingMember = OrganizationUser::where('organization_id', $organization->id)
            ->whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['email']);
            })
            ->where('status', 'active')
            ->first();

        if ($existingMember) {
            return back()->with('error', "{$validated['email']} is already an active member of {$organization->name}.");
        }

        // Delete any existing pending unaccepted invitations for this email in this org
        OrganizationInvitation::where('organization_id', $organization->id)
            ->where('email', $validated['email'])
            ->whereNull('accepted_at')
            ->delete();

        $token = Str::random(40);

        $invitation = OrganizationInvitation::create([
            'organization_id' => $organization->id,
            'email' => $validated['email'],
            'role' => $validated['role'],
            'token' => $token,
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays(7),
        ]);

        // Dispatch invitation email
        try {
            Mail::to($validated['email'])->send(new OrganizationInvitationMail($invitation));
        } catch (\Throwable $e) {
            Log::error('Failed to send organization invitation email: '.$e->getMessage());
        }

        return back()->with('success', "Invitation sent to {$validated['email']}.");
    }

    /**
     * Directly create and enroll a teacher or staff member (no invite email required).
     */
    public function storeMemberDirect(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404, 'No active organization found.');
        }

        $this->authorize('manageMembers', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:teacher,admin',
            'title' => 'nullable|string|max:100',
        ]);

        // Check if user is already in this organization
        $existingMembership = OrganizationUser::where('organization_id', $organization->id)
            ->whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['email']);
            })
            ->first();

        if ($existingMembership) {
            return back()->with('error', "{$validated['email']} is already an active member of {$organization->name}.");
        }

        // Find or create User account
        $user = User::where('email', $validated['email'])->first();

        if ($user) {
            // Update password if specified
            if (! empty($validated['password'])) {
                $user->update([
                    'password' => Hash::make($validated['password']),
                ]);
            }
            if (! $user->email_verified_at) {
                $user->update(['email_verified_at' => now()]);
            }
        } else {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'email_verified_at' => now(),
            ]);
        }

        // Attach to organization as active
        OrganizationUser::create([
            'organization_id' => $organization->id,
            'user_id' => $user->id,
            'role' => $validated['role'],
            'status' => 'active',
            'title' => ($validated['title'] ?? null) ?: ($validated['role'] === 'teacher' ? 'Faculty / Instructor' : 'Staff Admin'),
        ]);

        // Delete any pending invitations for this email in this org
        OrganizationInvitation::where('organization_id', $organization->id)
            ->where('email', $validated['email'])
            ->delete();

        $dispatcher = app(\App\Services\NotificationDispatcher::class);
        $roleLabel = ucfirst($validated['role']);
        $dispatcher->toOrganizationRoles(
            organizationId: $organization->id,
            roles: ['owner', 'admin'],
            category: 'organization_activity',
            title: "New {$roleLabel} Added: {$user->name}",
            message: "{$user->name} joined {$organization->name} as {$roleLabel}.",
            url: '/organizations/members',
            icon: 'users',
            severity: 'success',
            excludeUserId: $request->user()->id,
        );

        $dispatcher->toUsers(
            recipients: $user,
            organizationId: $organization->id,
            category: 'system',
            title: "Welcome to {$organization->name}",
            message: "Your {$roleLabel} account is now active in {$organization->name}.",
            url: '/dashboard',
            icon: 'sparkles',
            severity: 'success',
        );

        return back()->with('success', "Member {$user->name} ({$validated['role']}) added directly and activated! They can now log in immediately.");
    }

    /**
     * Directly activate a pending invitation without requiring email dispatch.
     */
    public function activateInvitationDirect(OrganizationInvitation $invitation, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $invitation->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageMembers', $organization);

        $tempPassword = $request->input('password') ?: 'Welcome@'.date('Y');

        $user = User::firstOrCreate(
            ['email' => $invitation->email],
            [
                'name' => explode('@', $invitation->email)[0],
                'password' => Hash::make($tempPassword),
                'role' => $invitation->role,
                'email_verified_at' => now(),
            ]
        );

        OrganizationUser::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'user_id' => $user->id,
            ],
            [
                'role' => $invitation->role,
                'status' => 'active',
                'title' => $invitation->role === 'teacher' ? 'Faculty Member' : 'Staff Admin',
            ]
        );

        $invitation->update([
            'accepted_at' => now(),
        ]);

        return back()->with('success', "Member {$invitation->email} has been directly activated. Temporary Password: {$tempPassword}");
    }

    /**
     * Accept an invitation using its secure token.
     */
    public function acceptInvite(string $token, Request $request): RedirectResponse
    {
        $invitation = OrganizationInvitation::with(['organization', 'inviter'])
            ->where('token', $token)
            ->first();

        if (! $invitation) {
            return redirect()->route('login')->with('error', 'The invitation token is invalid or does not exist.');
        }

        if ($invitation->accepted_at !== null) {
            return redirect()->route('login')->with('error', 'This invitation has already been accepted.');
        }

        if ($invitation->expires_at && $invitation->expires_at->isPast()) {
            return redirect()->route('login')->with('error', 'This invitation has expired. Please request a new invitation from your institution administrator.');
        }

        if (! $invitation->organization || $invitation->organization->status !== 'active') {
            return redirect()->route('login')->with('error', 'The organization associated with this invitation is inactive.');
        }

        // If user is not logged in:
        if (! Auth::check()) {
            $userExists = User::where('email', $invitation->email)->exists();

            $request->session()->put('pending_invitation_token', $token);
            $request->session()->put('url.intended', route('invitations.accept', ['token' => $token]));

            if ($userExists) {
                return redirect()->route('login', ['email' => $invitation->email])
                    ->with('info', "Please sign in with {$invitation->email} to accept your invitation to join {$invitation->organization->name}.");
            }

            return redirect()->route('register', ['journey' => 'join', 'token' => $token])
                ->with('info', "Create your account to complete your invitation and join {$invitation->organization->name}.");
        }

        $user = $request->user();

        // If logged in, check email matching
        if (strcasecmp($user->email, $invitation->email) !== 0) {
            return redirect()->route('dashboard')->with('error', "This invitation was issued to {$invitation->email}. You are currently logged in as {$user->email}. Please sign in with {$invitation->email} to accept it.");
        }

        // Attach user membership and mark accepted
        DB::transaction(function () use ($invitation, $user) {
            OrganizationUser::updateOrCreate(
                [
                    'organization_id' => $invitation->organization_id,
                    'user_id' => $user->id,
                ],
                [
                    'role' => $invitation->role,
                    'status' => 'active',
                    'title' => ucfirst($invitation->role),
                ]
            );

            $invitation->update(['accepted_at' => now()]);
        });

        // Set active session context to this organization
        TenantContext::set($invitation->organization);
        $request->session()->put('current_organization_id', $invitation->organization_id);
        return redirect()->route('dashboard')->with('success', "Welcome to {$invitation->organization->name}! You have joined as ".ucfirst($invitation->role).'.');
    }

    /**
     * Update member role, title, name, email or password.
     */
    public function updateMember(OrganizationUser $member, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $member->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('update', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'role' => 'required|string|in:owner,admin,teacher',
            'title' => 'nullable|string|max:100',
            'status' => 'required|string|in:active,inactive,suspended',
            'password' => 'nullable|string|min:6|max:100',
        ]);

        $member->load('user');
        if ($member->user) {
            $user = $member->user;
            $user->name = $validated['name'];
            $user->email = $validated['email'];
            if (!empty($validated['password'])) {
                $user->password = Hash::make($validated['password']);
            }
            $user->save();
        }

        $member->update([
            'role' => $validated['role'],
            'title' => $validated['title'] ?? null,
            'status' => $validated['status'],
        ]);

        return back()->with('success', "Staff member {$validated['name']} updated successfully.");
    }

    /**
     * Remove member from organization.
     */
    public function destroyMember(OrganizationUser $member, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $member->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('update', $organization);

        // Prevent self-deletion if current user
        if ($member->user_id === $request->user()->id) {
            return back()->with('error', 'You cannot remove your own account from the organization.');
        }

        $memberName = $member->user?->name ?? 'Member';
        $member->delete();

        return back()->with('success', "Member {$memberName} removed from organization.");
    }

    /**
     * Revoke / delete a pending invitation.
     */
    public function destroyInvitation(OrganizationInvitation $invitation): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $invitation->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('update', $organization);

        $email = $invitation->email;
        $invitation->delete();

        return back()->with('success', "Invitation for {$email} was cancelled.");
    }
}
