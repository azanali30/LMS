<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\Billing\SubscriptionService;
use App\Services\TenantContext;
use App\Services\TenantResolver;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class RegistrationJourneyController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    /**
     * Show the unified 3-journey registration view.
     */
    public function show(Request $request): Response
    {
        $journey = $request->query('journey', 'school');
        $token = $request->query('token');
        $selectedPlan = $request->query('plan', 'starter');
        $selectedInterval = $request->query('interval', 'monthly');

        $invitation = null;
        if ($token) {
            try {
                $invitation = OrganizationInvitation::with('organization')
                    ->where('token', $token)
                    ->whereNull('accepted_at')
                    ->where('expires_at', '>', now())
                    ->first();

                if ($invitation) {
                    $journey = 'join';
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $plans = collect();
        try {
            $plans = SubscriptionPlan::where('is_active', true)
                ->whereIn('slug', ['starter', 'growth', 'professional', 'enterprise'])
                ->get()
                ->map(fn (SubscriptionPlan $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'description' => $p->description,
                    'price_cents' => $p->price_cents,
                    'price_annual_cents' => $p->price_annual_cents,
                    'price_monthly_formatted' => $p->formattedPrice('monthly'),
                    'price_annual_formatted' => $p->formattedPrice('annual'),
                    'currency' => $p->currency,
                    'max_organizations' => $p->max_organizations,
                    'organization_limit' => $p->organizationLimit(),
                    'features' => $p->features ?: [],
                    'is_popular' => $p->slug === 'growth',
                    'is_custom' => $p->isCustomPricing(),
                ]);
        } catch (\Throwable $e) {
            report($e);
            $plans = collect();
        }

        return Inertia::render('auth/register', [
            'initialJourney' => $journey,
            'initialToken' => $token,
            'initialPlan' => $selectedPlan,
            'initialInterval' => $selectedInterval,
            'plans' => $plans,
            'currency' => config('plans.currency', 'USD'),
            'trialDays' => (int) config('plans.trial_days', 30),
            'invitation' => $invitation ? [
                'token' => $invitation->token,
                'email' => $invitation->email,
                'role' => $invitation->role,
                'organization_name' => $invitation->organization->name,
            ] : null,
        ]);
    }

    /**
     * Journey A: Register a new School / Academy Owner with 30-day trial.
     */
    public function registerSchool(Request $request): RedirectResponse
    {
        $reserved = config('app.reserved_subdomains', []);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
            'school_name' => 'required|string|max:255',
            'subdomain' => [
                'nullable',
                'string',
                'max:100',
                'alpha_dash',
                function ($attribute, $value, $fail) use ($reserved) {
                    if (in_array(strtolower($value), $reserved, true)) {
                        $fail("The subdomain '{$value}' is reserved for platform use.");
                    }
                    if (Organization::where('slug', strtolower($value))->exists()) {
                        $fail("The subdomain '{$value}' is already taken by another institution.");
                    }
                },
            ],
            'plan' => 'nullable|string|max:50',
            'billing_interval' => 'nullable|string|in:monthly,annual',
            'organization_type' => 'required|string|in:school,academy,coaching_center,online_course_provider,college,training_institute,other',
        ]);

        // Prevent repeated registrations from bypassing trial eligibility
        $existingOwnerWithTrial = User::where('email', $validated['email'])->first();
        if ($existingOwnerWithTrial && $existingOwnerWithTrial->organizations()->wherePivot('role', 'owner')->exists()) {
            return back()->withErrors(['email' => 'An active institution owner workspace already exists under this email.']);
        }

        // Determine unique slug
        if (! empty($validated['subdomain'])) {
            $slug = strtolower(trim($validated['subdomain']));
        } else {
            $baseSlug = Str::slug($validated['school_name']);
            if (empty($baseSlug)) {
                $baseSlug = 'school-'.strtolower(Str::random(5));
            }
            $slug = $baseSlug;
            $count = 1;
            while (in_array(strtolower($slug), $reserved, true) || Organization::where('slug', $slug)->exists()) {
                $slug = "{$baseSlug}-{$count}";
                $count++;
            }
        }

        $organization = null;
        $subscription = null;
        $user = DB::transaction(function () use ($validated, $slug, &$organization, &$subscription) {
            // 1. Create Owner User
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'student',
            ]);
            $user->markEmailAsVerified();

            // 2. Create Organization
            $organization = Organization::create([
                'name' => $validated['school_name'],
                'slug' => $slug,
                'organization_type' => $validated['organization_type'],
                'email' => $validated['email'],
                'timezone' => 'UTC',
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            // 3. Attach Owner membership
            OrganizationUser::create([
                'organization_id' => $organization->id,
                'user_id' => $user->id,
                'role' => 'owner',
                'status' => 'active',
                'title' => 'Founder & Director',
            ]);

            // 4. Default Academic Year and Terms
            $year = (int) date('Y');
            $academicYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => "{$year}-".($year + 1).' Academic Session',
                'start_date' => "{$year}-09-01",
                'end_date' => ($year + 1).'-06-30',
                'is_current' => true,
            ]);

            AcademicTerm::create([
                'organization_id' => $organization->id,
                'academic_year_id' => $academicYear->id,
                'name' => 'Fall Term (First Half)',
                'start_date' => "{$year}-09-01",
                'end_date' => "{$year}-12-31",
                'is_current' => true,
            ]);

            AcademicTerm::create([
                'organization_id' => $organization->id,
                'academic_year_id' => $academicYear->id,
                'name' => 'Spring Term (Second Half)',
                'start_date' => ($year + 1).'-01-01',
                'end_date' => ($year + 1).'-06-30',
                'is_current' => false,
            ]);

            // 5. Attach 30-Day Free Trial Subscription via SubscriptionService
            $selectedPlanSlug = $validated['plan'] ?? 'starter';
            $plan = SubscriptionPlan::findBySlug($selectedPlanSlug)
                ?? SubscriptionPlan::findBySlug('starter')
                ?? SubscriptionPlan::where('slug', 'starter')->first()
                ?? SubscriptionPlan::where('slug', 'bronze')->first()
                ?? SubscriptionPlan::first();

            $billingInterval = $validated['billing_interval'] ?? 'monthly';

            if ($plan) {
                $subscription = $this->subscriptionService->createInitialSubscription(
                    $organization,
                    $user,
                    $plan,
                    $billingInterval
                );
            }

            return $user;
        });

        event(new Registered($user));
        Auth::login($user);

        if ($organization) {
            TenantContext::set($organization);
            $request->session()->put('current_organization_id', $organization->id);

            $message = ($subscription && $subscription->isPendingPaymentMethod())
                ? "Welcome to InstitutoPropio! {$validated['school_name']} workspace has been registered. Set up your payment method to activate your 30-day trial."
                : "Welcome to InstitutoPropio! {$validated['school_name']} 30-day trial is now active.";

            $configuredDomain = config('app.domain');
            if ($configuredDomain && str_ends_with($request->getHost(), '.'.$configuredDomain)) {
                return redirect()->away($organization->subdomainUrl('/dashboard'))
                    ->with('success', $message);
            }
        }

        $message = ($subscription && $subscription->isPendingPaymentMethod())
            ? "Welcome to InstitutoPropio! {$validated['school_name']} workspace has been registered. Set up your payment method to activate your 30-day trial."
            : "Welcome to InstitutoPropio! {$validated['school_name']} 30-day trial is now active.";

        return redirect()->route('dashboard')->with('success', $message);
    }

    /**
     * Journey B: Join an Existing School with verified Invitation.
     */
    public function registerJoin(Request $request): RedirectResponse
    {
        if ($request->filled('token') && ! $request->filled('invitation_token')) {
            $request->merge(['invitation_token' => $request->input('token')]);
        }

        $validated = $request->validate([
            'invitation_token' => 'required|string',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $invitation = OrganizationInvitation::where('token', $validated['invitation_token'])
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $invitation) {
            return back()->withErrors([
                'invitation_token' => 'This invitation is invalid, has expired, or was already accepted.',
                'token' => 'This invitation is invalid, has expired, or was already accepted.',
            ]);
        }

        if (strcasecmp($validated['email'], $invitation->email) !== 0) {
            return back()->withErrors([
                'email' => "This invitation was sent specifically to {$invitation->email}. Please use that email address.",
            ]);
        }

        $user = DB::transaction(function () use ($validated, $invitation) {
            $user = User::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'name' => $validated['name'],
                    'password' => Hash::make($validated['password']),
                    'role' => 'student',
                ]
            );
            $user->markEmailAsVerified();

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

            return $user;
        });

        event(new Registered($user));
        Auth::login($user);

        TenantContext::set($invitation->organization);
        $request->session()->put('current_organization_id', $invitation->organization_id);

        return redirect()->route('dashboard')->with('success', "You have joined {$invitation->organization->name} as {$invitation->role}!");
    }

    /**
     * Journey C: Register an Individual Online Learner.
     */
    public function registerLearner(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'learner',
        ]);
        $user->markEmailAsVerified();

        event(new Registered($user));
        Auth::login($user);
        $request->session()->put('is_learner', true);

        return redirect()->route('dashboard')->with('success', 'Welcome to your individual learning hub! Explore courses and build your skills.');
    }
}
