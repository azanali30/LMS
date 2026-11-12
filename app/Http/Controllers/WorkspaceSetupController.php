<?php

namespace App\Http\Controllers;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\SubscriptionPlan;
use App\Services\TenantContext;
use App\Services\TenantResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceSetupController extends Controller
{
    /**
     * Display the multi-step Workspace Setup Wizard.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // If the user already belongs to an active organization as owner and is not creating an additional workspace
        $ownedOrganizations = $user->organizations()
            ->where('organizations.status', 'active')
            ->wherePivot('status', 'active')
            ->wherePivot('role', 'owner')
            ->get();

        if ($ownedOrganizations->isNotEmpty() && $request->routeIs('workspace.setup') && ! $request->has('new')) {
            return redirect()->route('dashboard')
                ->with('info', "Your school workspace '{$ownedOrganizations->first()->name}' is already active. You can customize branding and settings anytime.");
        }

        if (! $user->canCreateOrganization()) {
            if ($ownedOrganizations->isNotEmpty()) {
                return redirect()->route('organizations.billing.index')
                    ->with('error', 'You have reached the maximum organization limit allowed by your subscription plan. Please upgrade your plan to create additional workspaces.');
            }

            abort(403, 'Unauthorized. You do not have permission to create an organization.');
        }

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
        $selectedPlan = $request->query('plan', 'starter');

        $currentYear = (int) date('Y');
        $defaultAcademicSession = [
            'name' => "{$currentYear}-".($currentYear + 1).' Academic Session',
            'start_date' => "{$currentYear}-09-01",
            'end_date' => ($currentYear + 1).'-06-30',
        ];

        return Inertia::render('workspace/setup', [
            'plans' => $plans,
            'initialPlan' => $selectedPlan,
            'defaultAcademicSession' => $defaultAcademicSession,
            'rootDomain' => app(TenantResolver::class)->getRootDomain(),
            'appUrl' => config('app.url', 'http://localhost:8000'),
            'ownedCount' => $ownedOrganizations->count(),
            'maxAllowed' => $user->maxOrganizationEntitlement(),
        ]);
    }

    /**
     * Check live slug availability for real-time form feedback.
     */
    public function checkSlug(Request $request): JsonResponse
    {
        $raw = (string) $request->query('slug', '');
        $slug = strtolower(trim($raw));

        if (empty($slug)) {
            return response()->json([
                'available' => false,
                'slug' => '',
                'message' => 'Please provide a workspace subdomain identifier.',
            ]);
        }

        $tenantResolver = app(TenantResolver::class);

        // Reserved subdomains check
        if ($tenantResolver->isReservedSubdomain($slug)) {
            return response()->json([
                'available' => false,
                'slug' => $slug,
                'message' => "The subdomain '{$slug}' is reserved for platform system use.",
            ]);
        }

        // Slug format check
        if (! $tenantResolver->isValidSlug($slug)) {
            return response()->json([
                'available' => false,
                'slug' => $slug,
                'message' => 'Subdomain may only contain lowercase letters, numbers, and hyphens.',
            ]);
        }

        // Database uniqueness check
        $exists = Organization::where('slug', $slug)->exists();
        if ($exists) {
            return response()->json([
                'available' => false,
                'slug' => $slug,
                'message' => "The subdomain '{$slug}' is already taken by another institution.",
            ]);
        }

        $previewUrl = $tenantResolver->buildSubdomainUrl($slug);

        return response()->json([
            'available' => true,
            'slug' => $slug,
            'preview_url' => $previewUrl,
            'message' => "Subdomain '{$slug}' is available!",
        ]);
    }

    /**
     * Process and store the newly created workspace from the wizard.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->canCreateOrganization()) {
            abort(403, 'Unauthorized. You have reached the maximum organization limit allowed by your subscription plan.');
        }

        $reserved = config('app.reserved_subdomains', []);

        $validated = $request->validate([
            // Step 1: Organization Identity
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:100',
                'alpha_dash',
                'unique:organizations,slug',
                function ($attribute, $value, $fail) use ($reserved) {
                    $cleaned = strtolower((string) $value);
                    if (in_array($cleaned, $reserved, true) || app(TenantResolver::class)->isReservedSubdomain($cleaned)) {
                        $fail("The subdomain '{$value}' is reserved for platform use. Please select a different identifier.");
                    }
                },
            ],
            'organization_type' => 'required|string|in:school,academy,college,training_institute,other,coaching_center,online_course_provider',

            // Step 2: Branding
            'logo' => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,webp,svg', 'max:2048'],
            'logo_path' => ['nullable', 'string', 'max:500'],
            'primary_color' => ['nullable', 'string', 'max:25', 'regex:/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/'],
            'accent_color' => ['nullable', 'string', 'max:25', 'regex:/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/'],

            // Step 3: Academic Setup
            'academic_session_name' => 'nullable|string|max:255',
            'academic_start_date' => 'nullable|date',
            'academic_end_date' => 'nullable|date|after_or_equal:academic_start_date',
            'skip_academic_setup' => 'nullable|boolean',

            // Preferences
            'timezone' => 'nullable|string|max:50',
            'currency' => 'nullable|string|size:3',
            'plan' => 'nullable|string|max:50',
        ]);

        // Upload logo if file provided
        $logoPath = $validated['logo_path'] ?? null;
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $logoPath = '/storage/' . ltrim($path, '/');
        }

        $organization = DB::transaction(function () use ($validated, $user, $logoPath) {
            // 1. Create Organization Record
            $slug = strtolower(trim($validated['slug']));
            $org = Organization::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'organization_type' => $validated['organization_type'],
                'email' => $user->email,
                'timezone' => $validated['timezone'] ?? 'UTC',
                'currency' => strtoupper($validated['currency'] ?? 'USD'),
                'primary_color' => $validated['primary_color'] ?? '#6366f1',
                'accent_color' => $validated['accent_color'] ?? '#f59e0b',
                'logo_path' => $logoPath,
                'status' => 'active',
                'created_by' => $user->id,
            ]);

            // 2. Attach Owner Membership
            OrganizationUser::firstOrCreate(
                [
                    'organization_id' => $org->id,
                    'user_id' => $user->id,
                ],
                [
                    'role' => 'owner',
                    'status' => 'active',
                    'title' => 'Founder & Director',
                ]
            );

            // 3. Initialize Default Academic Session (Idempotent)
            $currentYear = (int) date('Y');
            $sessionName = (! empty($validated['academic_session_name']) && empty($validated['skip_academic_setup']))
                ? $validated['academic_session_name']
                : "{$currentYear}-".($currentYear + 1).' Academic Session';
            $startDate = (! empty($validated['academic_start_date']) && empty($validated['skip_academic_setup']))
                ? $validated['academic_start_date']
                : "{$currentYear}-09-01";
            $endDate = (! empty($validated['academic_end_date']) && empty($validated['skip_academic_setup']))
                ? $validated['academic_end_date']
                : ($currentYear + 1).'-06-30';

            $academicYear = AcademicYear::firstOrCreate(
                [
                    'organization_id' => $org->id,
                    'is_current' => true,
                ],
                [
                    'name' => $sessionName,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]
            );

            AcademicTerm::firstOrCreate(
                [
                    'organization_id' => $org->id,
                    'academic_year_id' => $academicYear->id,
                    'name' => 'Fall Term (First Half)',
                ],
                [
                    'start_date' => $startDate,
                    'end_date' => "{$currentYear}-12-31",
                    'is_current' => true,
                ]
            );

            AcademicTerm::firstOrCreate(
                [
                    'organization_id' => $org->id,
                    'academic_year_id' => $academicYear->id,
                    'name' => 'Spring Term (Second Half)',
                ],
                [
                    'start_date' => ($currentYear + 1).'-01-01',
                    'end_date' => $endDate,
                    'is_current' => false,
                ]
            );

            // 4. Attach Subscription / 30-Day Free Trial
            // Check if user already has an active subscription or trial from an existing organization
            $ownerOrgIds = $user->organizations()
                ->wherePivot('role', 'owner')
                ->where('organizations.id', '!=', $org->id)
                ->pluck('organizations.id');

            $existingSub = OrganizationSubscription::with('plan')
                ->where(function ($query) use ($user, $ownerOrgIds) {
                    $query->where('user_id', $user->id)
                        ->orWhereIn('organization_id', $ownerOrgIds);
                })
                ->orderByRaw("CASE WHEN status = 'active' THEN 1 WHEN status = 'trialing' THEN 2 ELSE 3 END")
                ->first();

            if ($existingSub) {
                // Inherit existing active plan
                $org->subscriptions()->create([
                    'plan_id' => $existingSub->plan_id,
                    'user_id' => $user->id,
                    'status' => $existingSub->status,
                    'starts_at' => now(),
                    'trial_ends_at' => $existingSub->trial_ends_at,
                    'ends_at' => $existingSub->ends_at,
                    'billing_type' => $existingSub->billing_type ?? 'online',
                ]);
            } else {
                // New registration trial
                $selectedPlanSlug = $validated['plan'] ?? 'starter';
                $plan = SubscriptionPlan::findBySlug($selectedPlanSlug)
                    ?? SubscriptionPlan::findBySlug('starter')
                    ?? SubscriptionPlan::where('slug', 'starter')->first()
                    ?? SubscriptionPlan::where('slug', 'bronze')->first()
                    ?? SubscriptionPlan::first();

                $trialDays = (int) config('billing.trial_days', 30);

                if ($plan) {
                    $org->subscriptions()->create([
                        'plan_id' => $plan->id,
                        'user_id' => $user->id,
                        'status' => OrganizationSubscription::STATUS_TRIALING,
                        'starts_at' => now(),
                        'trial_ends_at' => now()->addDays($trialDays),
                        'billing_type' => 'trial',
                        'billing_interval' => 'monthly',
                        'currency' => config('plans.currency', 'USD'),
                    ]);
                }
            }

            return $org;
        });

        // 5. Establish Active Session & Tenant Context
        TenantContext::set($organization);
        $request->session()->put('current_organization_id', $organization->id);
        $request->session()->forget('is_learner');

        return redirect()->route('dashboard')
            ->with('success', "Welcome to InstitutoPropio! {$organization->name} workspace setup is complete and your 30-day free trial is active.");
    }
}
