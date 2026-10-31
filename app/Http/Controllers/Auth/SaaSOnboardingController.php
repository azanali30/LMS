<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\PaymentApprovalRequest;
use App\Models\SubscriptionHistory;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SaaSOnboardingController extends Controller
{
    /**
     * Display the new multi-step SaaS registration onboarding flow.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        // If invitation token provided in query, redirect to invitation acceptance
        if ($token = $request->query('token')) {
            return redirect()->route('invitations.accept', ['token' => $token]);
        }

        $configPlans = config('manual_payment.plans', []);
        $plans = collect($configPlans)->map(function ($plan, $key) {
            return [
                'name' => $plan['name'],
                'slug' => $plan['slug'] ?? $key,
                'headline' => $plan['headline'] ?? '',
                'target' => $plan['target'] ?? '',
                'monthly_cents' => $plan['monthly_cents'],
                'monthly_formatted' => '$'.number_format($plan['monthly_cents'] / 100, 0).'/mo',
                'yearly_cents' => $plan['yearly_cents'],
                'yearly_available' => $plan['yearly_available'] ?? false,
                'is_popular' => $plan['is_popular'] ?? false,
                'max_organizations' => $plan['max_organizations'] ?? 1,
                'features' => $plan['features'] ?? [],
            ];
        })->values();

        $methods = collect(config('manual_payment.methods', []))->values();

        return Inertia::render('auth/register-onboarding', [
            'plans' => $plans,
            'paymentMethods' => $methods,
            'currency' => config('manual_payment.currency', 'USD'),
            'trialDays' => (int) config('manual_payment.trial_days', 30),
            'yearlyPricingAvailable' => (bool) config('manual_payment.yearly_pricing_available', false),
            'initialEmail' => $request->query('email', ''),
            'initialPlan' => $request->query('plan', 'starter'),
            'initialInterval' => $request->query('interval', 'monthly'),
        ]);
    }

    /**
     * Step 1: Validate Email and Check for Existing Registrations or Pending Approvals.
     */
    public function checkEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        // 1. Check if user already exists
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'status' => 'registered',
                'message' => 'An active user account with this email address already exists. Please log in to access your portal.',
            ], 422);
        }

        // 2. Check for active pending payment approval
        $pending = PaymentApprovalRequest::where('email', $email)
            ->where('status', PaymentApprovalRequest::STATUS_PENDING)
            ->latest()
            ->first();

        if ($pending) {
            return response()->json([
                'status' => 'pending_approval',
                'request_id' => $pending->id,
                'transaction_reference' => $pending->transaction_reference,
                'submitted_at' => $pending->created_at->toIso8601String(),
                'message' => 'A payment approval request for this email is currently awaiting admin verification.',
            ]);
        }

        // 3. Check for approved request awaiting account completion
        $approved = PaymentApprovalRequest::where('email', $email)
            ->where('status', PaymentApprovalRequest::STATUS_APPROVED)
            ->whereNull('completed_at')
            ->latest()
            ->first();

        if ($approved && $approved->isTokenValid()) {
            return response()->json([
                'status' => 'approved_ready',
                'completion_url' => url("/onboarding/complete/{$approved->completion_token}"),
                'message' => 'Your payment has already been approved! Click below to complete your account setup.',
            ]);
        }

        // 4. Check for rejected request (allow resubmission)
        $rejected = PaymentApprovalRequest::where('email', $email)
            ->where('status', PaymentApprovalRequest::STATUS_REJECTED)
            ->latest()
            ->first();

        if ($rejected) {
            return response()->json([
                'status' => 'previously_rejected',
                'rejection_reason' => $rejected->rejection_reason,
                'message' => 'A previous payment attempt was rejected: '.($rejected->rejection_reason ?: 'Unable to verify payment.').' You may submit corrected payment proof.',
            ]);
        }

        return response()->json([
            'status' => 'available',
            'message' => 'Email is available. Proceed to plan selection.',
        ]);
    }

    /**
     * Step 4: Submit Payment Proof & Create Pending Approval Request.
     */
    public function submitPayment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'plan_slug' => ['required', 'string', 'in:starter,growth,professional'],
            'billing_interval' => ['required', 'string', 'in:monthly,annual'],
            'payment_method' => ['required', 'string', 'in:bank_transfer,jazzcash,easypaisa,other'],
            'transaction_reference' => ['required', 'string', 'max:120'],
            'receipt' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:5120'], // 5MB max
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $email = strtolower(trim($validated['email']));

        // Check again that email is not already registered as an active user
        if (User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'This email is already registered. Please sign in.',
            ]);
        }

        // Prevent duplicate transaction references across active requests
        $existingTxn = PaymentApprovalRequest::where('transaction_reference', trim($validated['transaction_reference']))
            ->whereIn('status', [PaymentApprovalRequest::STATUS_PENDING, PaymentApprovalRequest::STATUS_APPROVED])
            ->exists();

        if ($existingTxn) {
            throw ValidationException::withMessages([
                'transaction_reference' => 'This transaction ID has already been submitted for verification.',
            ]);
        }

        // Prevent multiple pending requests for same email
        $existingPending = PaymentApprovalRequest::where('email', $email)
            ->where('status', PaymentApprovalRequest::STATUS_PENDING)
            ->first();

        if ($existingPending) {
            throw ValidationException::withMessages([
                'email' => 'A payment approval request is already pending verification for this email address.',
            ]);
        }

        // Store receipt in private storage (local disk root = storage/app/private)
        $file = $request->file('receipt');
        $storedPath = Storage::disk('local')->putFile('payment_receipts', $file);

        // Determine price
        $planConfig = config("manual_payment.plans.{$validated['plan_slug']}", []);
        $amountCents = $planConfig['monthly_cents'] ?? 1900;
        if ($validated['billing_interval'] === 'annual' && ! empty($planConfig['yearly_cents'])) {
            $amountCents = $planConfig['yearly_cents'];
        }

        $approvalRequest = PaymentApprovalRequest::create([
            'email' => $email,
            'plan_slug' => $validated['plan_slug'],
            'billing_interval' => $validated['billing_interval'],
            'amount_cents' => $amountCents,
            'currency' => config('manual_payment.currency', 'USD'),
            'payment_method' => $validated['payment_method'],
            'transaction_reference' => trim($validated['transaction_reference']),
            'receipt_path' => $storedPath,
            'receipt_original_name' => $file->getClientOriginalName(),
            'receipt_mime' => $file->getClientMimeType(),
            'receipt_size_bytes' => $file->getSize(),
            'notes' => $validated['notes'] ?? null,
            'status' => PaymentApprovalRequest::STATUS_PENDING,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'request_id' => $approvalRequest->id,
            'reference' => $approvalRequest->transaction_reference,
            'email' => $approvalRequest->email,
            'plan' => $approvalRequest->planDisplayName(),
            'submitted_at' => $approvalRequest->created_at->format('M d, Y h:i A'),
            'message' => 'Payment proof submitted successfully. Your request is now awaiting administrator verification.',
        ]);
    }

    /**
     * Check Request Status page.
     */
    public function status(Request $request): Response|JsonResponse
    {
        $email = $request->query('email') ? strtolower(trim($request->query('email'))) : null;
        $id = $request->query('id');

        $query = PaymentApprovalRequest::query();
        if ($id) {
            $query->where('id', $id);
        } elseif ($email) {
            $query->where('email', $email);
        } else {
            return Inertia::render('auth/onboarding-status', ['request' => null]);
        }

        $approvalRequest = $query->latest()->first();

        if ($request->wantsJson()) {
            if (! $approvalRequest) {
                return response()->json(['found' => false], 404);
            }
            return response()->json([
                'found' => true,
                'id' => $approvalRequest->id,
                'email' => $approvalRequest->email,
                'status' => $approvalRequest->status,
                'rejection_reason' => $approvalRequest->rejection_reason,
                'completion_url' => $approvalRequest->isTokenValid() ? url("/onboarding/complete/{$approvalRequest->completion_token}") : null,
            ]);
        }

        return Inertia::render('auth/onboarding-status', [
            'approvalRequest' => $approvalRequest ? [
                'id' => $approvalRequest->id,
                'email' => $approvalRequest->email,
                'plan_name' => $approvalRequest->planDisplayName(),
                'billing_interval' => $approvalRequest->billing_interval,
                'status' => $approvalRequest->status,
                'amount_formatted' => $approvalRequest->formattedAmount(),
                'transaction_reference' => $approvalRequest->transaction_reference,
                'rejection_reason' => $approvalRequest->rejection_reason,
                'completion_url' => $approvalRequest->isTokenValid() ? url("/onboarding/complete/{$approvalRequest->completion_token}") : null,
                'created_at' => $approvalRequest->created_at->format('M d, Y h:i A'),
            ] : null,
            'searchEmail' => $email,
        ]);
    }

    /**
     * Step 5: Render Account & Institution Completion Form.
     */
    public function showComplete(string $token): Response|RedirectResponse
    {
        $approvalRequest = PaymentApprovalRequest::where('completion_token', $token)->first();

        if (! $approvalRequest || ! $approvalRequest->isTokenValid()) {
            return redirect()->route('register')
                ->with('error', 'This account completion link is invalid, expired, or has already been used.');
        }

        $reserved = config('app.reserved_subdomains', []);

        return Inertia::render('auth/complete-account', [
            'token' => $token,
            'email' => $approvalRequest->email,
            'plan_slug' => $approvalRequest->plan_slug,
            'plan_name' => $approvalRequest->planDisplayName(),
            'billing_interval' => $approvalRequest->billing_interval,
            'reservedSubdomains' => $reserved,
            'organizationTypes' => [
                ['value' => 'school', 'label' => 'K-12 School / High School'],
                ['value' => 'academy', 'label' => 'Private Academy / Secondary School'],
                ['value' => 'college', 'label' => 'Higher Education / College'],
                ['value' => 'coaching_center', 'label' => 'Coaching / Test Prep Center'],
                ['value' => 'online_course_provider', 'label' => 'Online Course / E-Learning Provider'],
                ['value' => 'training_institute', 'label' => 'Professional Training Institute'],
                ['value' => 'other', 'label' => 'Other Educational Institution'],
            ],
        ]);
    }

    /**
     * Step 5 Action: Store User, Organization, Owner Membership, and 30-Day Trial Subscription.
     */
    public function storeComplete(Request $request, string $token): RedirectResponse|Response
    {
        $approvalRequest = PaymentApprovalRequest::where('completion_token', $token)->first();

        if (! $approvalRequest || ! $approvalRequest->isTokenValid()) {
            return redirect()->route('register')
                ->with('error', 'This account completion link is invalid, expired, or has already been used.');
        }

        $reserved = config('app.reserved_subdomains', []);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'school_name' => ['required', 'string', 'max:255'],
            'organization_type' => ['required', 'string', 'in:school,academy,coaching_center,online_course_provider,college,training_institute,other'],
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
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // Double check email uniqueness
        if (User::where('email', $approvalRequest->email)->exists()) {
            throw ValidationException::withMessages([
                'email' => 'An account under this email address already exists. Please log in.',
            ]);
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

        $created = DB::transaction(function () use ($approvalRequest, $validated, $slug) {
            // 1. Create Owner User
            $user = User::create([
                'name' => $validated['name'],
                'email' => $approvalRequest->email,
                'password' => Hash::make($validated['password']),
                'role' => 'student', // Default platform role, owner at organization level
            ]);
            $user->markEmailAsVerified();

            // 2. Create Organization
            $organization = Organization::create([
                'name' => $validated['school_name'],
                'slug' => $slug,
                'organization_type' => $validated['organization_type'],
                'email' => $approvalRequest->email,
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

            // 4. Default Academic Session & Terms
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

            // 5. Create Approved Subscription with 30-Day Trial
            $plan = SubscriptionPlan::findBySlug($approvalRequest->plan_slug)
                ?? SubscriptionPlan::findBySlug('starter')
                ?? SubscriptionPlan::first();

            $approvedAt = $approvalRequest->approved_at ?: now();
            $trialEndsAt = Carbon::parse($approvedAt)->addDays(30);

            $subscription = OrganizationSubscription::create([
                'organization_id' => $organization->id,
                'plan_id' => $plan ? $plan->id : 1,
                'user_id' => $user->id,
                'status' => OrganizationSubscription::STATUS_TRIALING,
                'billing_type' => 'manual_payment',
                'billing_interval' => $approvalRequest->billing_interval ?: 'monthly',
                'currency' => $approvalRequest->currency ?: 'USD',
                'payment_method' => $approvalRequest->payment_method,
                'payment_method_status' => 'verified',
                'starts_at' => $approvedAt,
                'trial_ends_at' => $trialEndsAt,
            ]);

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'organization_id' => $organization->id,
                'user_id' => $user->id,
                'event' => 'created',
                'to_plan_id' => $plan ? $plan->id : 1,
                'to_status' => OrganizationSubscription::STATUS_TRIALING,
                'billing_interval' => $approvalRequest->billing_interval ?: 'monthly',
                'metadata' => [
                    'source' => 'manual_payment_approval',
                    'approval_request_id' => $approvalRequest->id,
                    'transaction_reference' => $approvalRequest->transaction_reference,
                    'approved_at' => $approvedAt->toIso8601String(),
                    'trial_days' => 30,
                ],
            ]);

            // 6. Invalidate single-use token and mark completion
            $approvalRequest->update([
                'completed_at' => now(),
                'created_user_id' => $user->id,
                'created_organization_id' => $organization->id,
                'created_subscription_id' => $subscription->id,
                'completion_token' => null, // single-use invalidation
            ]);

            return [
                'user' => $user,
                'organization' => $organization,
            ];
        });

        return Inertia::render('auth/complete-success', [
            'email' => $created['user']->email,
            'organizationName' => $created['organization']->name,
            'subdomain' => $created['organization']->slug,
        ]);
    }
}
