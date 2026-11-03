<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\TrackingVerificationCodeMail;
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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SaaSOnboardingController extends Controller
{
    /**
     * Display the multi-step SaaS registration onboarding flow with server-side progress restoration.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        // If invitation token provided in query, redirect to invitation acceptance
        if ($token = $request->query('token')) {
            return redirect()->route('invitations.accept', ['token' => $token]);
        }

        $configPlans = config('manual_payment.plans', []);
        $plans = collect($configPlans)->map(function ($plan, $key) {
            $monthlyCents = (int) ($plan['monthly_cents'] ?? 1900);
            $yearlyCents = isset($plan['yearly_cents']) ? (int) $plan['yearly_cents'] : null;

            return [
                'name' => $plan['name'],
                'slug' => $plan['slug'] ?? $key,
                'headline' => $plan['headline'] ?? '',
                'target' => $plan['target'] ?? '',
                'monthly_cents' => $monthlyCents,
                'monthly_formatted' => '$'.number_format($monthlyCents / 100, 0).'/mo',
                'yearly_cents' => $yearlyCents,
                'yearly_formatted' => $yearlyCents ? '$'.number_format($yearlyCents / 100, 0).'/yr' : null,
                'yearly_available' => $plan['yearly_available'] ?? ($yearlyCents !== null),
                'is_popular' => $plan['is_popular'] ?? false,
                'max_organizations' => $plan['max_organizations'] ?? 1,
                'features' => $plan['features'] ?? [],
            ];
        })->values();

        $methods = collect(config('manual_payment.methods', []))->values();

        // 1. Retrieve draft by session token or query token
        $sessionToken = $request->session()->get('onboarding_token') ?: $request->query('reg_token');
        $draft = null;

        if ($sessionToken) {
            $draft = PaymentApprovalRequest::where('registration_token', $sessionToken)->first();
        }

        // 2. Fallback: match by email query param if draft exists for email
        if (! $draft && $reqEmail = $request->query('email')) {
            $normEmail = strtolower(trim($reqEmail));
            $draft = PaymentApprovalRequest::where('email', $normEmail)
                ->where('status', PaymentApprovalRequest::STATUS_DRAFT)
                ->latest()
                ->first();

            if ($draft && $draft->registration_token) {
                $request->session()->put('onboarding_token', $draft->registration_token);
            }
        }

        // Defaults
        $initialStep = 1;
        $initialEmail = $request->query('email', '');
        $initialPlan = $request->query('plan', 'growth');
        $initialInterval = $request->query('interval', 'monthly');
        $initialMethod = 'bank_transfer';
        $submissionResult = null;

        if ($draft) {
            $initialEmail = $draft->email;
            $initialPlan = $draft->plan_slug ?: $initialPlan;
            $initialInterval = $draft->billing_interval ?: $initialInterval;
            $initialMethod = $draft->payment_method ?: $initialMethod;

            if ($draft->status === PaymentApprovalRequest::STATUS_PENDING) {
                // Application already submitted and pending review
                $initialStep = 5;
                $submissionResult = [
                    'reference' => $draft->transaction_reference,
                    'email' => $draft->email,
                    'plan' => $draft->planDisplayName(),
                    'submitted_at' => $draft->created_at->format('M d, Y h:i A'),
                ];
            } else {
                // Draft status: restore highest unlocked step (1 to 4)
                $initialStep = max(1, min(4, (int) ($draft->current_step ?: 1)));
            }
        }

        // Allow stepping back via ?step= param if already unlocked
        if ($request->has('step')) {
            $reqStep = (int) $request->query('step');
            if ($reqStep >= 1 && $reqStep <= $initialStep) {
                $initialStep = $reqStep;
            }
        }

        return Inertia::render('auth/register-onboarding', [
            'plans' => $plans,
            'paymentMethods' => $methods,
            'currency' => config('manual_payment.currency', 'USD'),
            'trialDays' => (int) config('manual_payment.trial_days', 30),
            'yearlyPricingAvailable' => (bool) config('manual_payment.yearly_pricing_available', true),
            'initialStep' => $initialStep,
            'initialEmail' => $initialEmail,
            'initialPlan' => $initialPlan,
            'initialInterval' => $initialInterval,
            'initialMethod' => $initialMethod,
            'registrationToken' => $draft?->registration_token,
            'submissionResult' => $submissionResult,
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
                'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
                'action' => 'login',
                'action_url' => route('login'),
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
                'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
                'action' => 'track',
                'action_url' => route('onboarding.status', ['email' => $email]),
                'transaction_reference' => $pending->transaction_reference,
                'submitted_at' => $pending->created_at->toIso8601String(),
            ], 422);
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
                'message' => 'Your payment has already been approved! Click below to complete your account setup.',
                'action' => 'complete',
                'completion_url' => url("/onboarding/complete/{$approved->completion_token}"),
            ], 422);
        }

        // 4. Check for rejected request (allow resubmission with helpful notice and create draft)
        $rejected = PaymentApprovalRequest::where('email', $email)
            ->where('status', PaymentApprovalRequest::STATUS_REJECTED)
            ->latest()
            ->first();

        if ($rejected) {
            $token = $request->session()->get('onboarding_token') ?: Str::random(40);
            $draft = PaymentApprovalRequest::where('registration_token', $token)->first();

            if (! $draft) {
                $draft = PaymentApprovalRequest::create([
                    'email' => $email,
                    'plan_slug' => $request->input('plan_slug', 'growth'),
                    'billing_interval' => $request->input('billing_interval', 'monthly'),
                    'current_step' => 2,
                    'status' => PaymentApprovalRequest::STATUS_DRAFT,
                    'registration_token' => $token,
                    'ip_address' => $request->ip(),
                ]);
            } else {
                $draft->update([
                    'email' => $email,
                    'current_step' => max(2, (int) ($draft->current_step ?: 1)),
                    'registration_token' => $token,
                ]);
            }

            $request->session()->put('onboarding_token', $token);

            return response()->json([
                'status' => 'previously_rejected',
                'rejection_reason' => $rejected->rejection_reason,
                'message' => 'A previous payment attempt was rejected: '.($rejected->rejection_reason ?: 'Unable to verify payment.').' You may submit corrected payment proof.',
                'registration_token' => $token,
                'step' => 2,
                'email' => $draft->email,
                'plan_slug' => $draft->plan_slug,
                'billing_interval' => $draft->billing_interval,
            ]);
        }

        // 5. Persist or update draft application record on the server
        $token = $request->session()->get('onboarding_token') ?: Str::random(40);
        $draft = PaymentApprovalRequest::where('registration_token', $token)->first();

        if (! $draft) {
            $draft = PaymentApprovalRequest::where('email', $email)
                ->where('status', PaymentApprovalRequest::STATUS_DRAFT)
                ->latest()
                ->first();
        }

        if (! $draft) {
            $draft = PaymentApprovalRequest::create([
                'email' => $email,
                'plan_slug' => $request->input('plan_slug', 'growth'),
                'billing_interval' => $request->input('billing_interval', 'monthly'),
                'current_step' => 2,
                'status' => PaymentApprovalRequest::STATUS_DRAFT,
                'registration_token' => $token,
                'ip_address' => $request->ip(),
            ]);
        } else {
            $draft->update([
                'email' => $email,
                'current_step' => max(2, (int) ($draft->current_step ?: 1)),
                'registration_token' => $token,
            ]);
        }

        $request->session()->put('onboarding_token', $token);

        return response()->json([
            'status' => 'available',
            'message' => 'Email is available. Proceeding to plan selection.',
            'notice' => null,
            'registration_token' => $token,
            'step' => 2,
            'email' => $draft->email,
            'plan_slug' => $draft->plan_slug,
            'billing_interval' => $draft->billing_interval,
        ]);
    }

    /**
     * Persist current step and selections on the server to survive reloads.
     */
    public function saveProgress(Request $request): JsonResponse
    {
        $token = $request->session()->get('onboarding_token') ?: $request->input('registration_token');
        if (! $token) {
            $token = Str::random(40);
            $request->session()->put('onboarding_token', $token);
        }

        $step = max(1, min(4, (int) $request->input('step', 1)));
        $draft = PaymentApprovalRequest::where('registration_token', $token)->first();

        // If email is provided, normalize and enforce duplicate restrictions
        if ($request->has('email') && ! empty($request->input('email'))) {
            $email = strtolower(trim($request->input('email')));

            // 1. Check User table
            if (User::where('email', $email)->exists()) {
                return response()->json([
                    'status' => 'registered',
                    'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
                ], 422);
            }

            // 2. Check pending applications
            $existingPending = PaymentApprovalRequest::where('email', $email)
                ->where('status', PaymentApprovalRequest::STATUS_PENDING)
                ->when($draft, fn ($q) => $q->where('id', '!=', $draft->id))
                ->exists();

            if ($existingPending) {
                return response()->json([
                    'status' => 'pending_approval',
                    'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
                    'tracking_url' => route('onboarding.status', ['email' => $email]),
                ], 422);
            }

            if (! $draft) {
                $draft = PaymentApprovalRequest::create([
                    'email' => $email,
                    'plan_slug' => $request->input('plan_slug', 'growth'),
                    'billing_interval' => $request->input('billing_interval', 'monthly'),
                    'current_step' => $step,
                    'status' => PaymentApprovalRequest::STATUS_DRAFT,
                    'registration_token' => $token,
                    'ip_address' => $request->ip(),
                ]);
            } else {
                $draft->update([
                    'email' => $email,
                    'current_step' => max((int) $draft->current_step, $step),
                ]);
            }
        }

        // Apply attribute updates to draft
        if ($draft && $draft->status === PaymentApprovalRequest::STATUS_DRAFT) {
            $updates = [];

            if ($request->has('step')) {
                $updates['current_step'] = $step;
            }

            if ($request->has('plan_slug') && in_array($request->input('plan_slug'), ['starter', 'growth', 'professional'], true)) {
                $updates['plan_slug'] = $request->input('plan_slug');
            }

            if ($request->has('billing_interval') && in_array($request->input('billing_interval'), ['monthly', 'annual'], true)) {
                $updates['billing_interval'] = $request->input('billing_interval');
            }

            if ($request->has('payment_method') && in_array($request->input('payment_method'), ['bank_transfer', 'jazzcash', 'easypaisa', 'other'], true)) {
                $updates['payment_method'] = $request->input('payment_method');
            }

            if (! empty($updates)) {
                $draft->update($updates);
            }
        }

        $request->session()->put('onboarding_token', $token);

        return response()->json([
            'success' => true,
            'step' => $draft ? $draft->current_step : $step,
            'registration_token' => $token,
            'email' => $draft?->email,
            'plan_slug' => $draft?->plan_slug,
            'billing_interval' => $draft?->billing_interval,
            'payment_method' => $draft?->payment_method,
        ]);
    }

    /**
     * Reset the active draft session and allow user to start fresh.
     */
    public function resetDraft(Request $request): JsonResponse
    {
        $token = $request->session()->get('onboarding_token') ?: $request->input('registration_token');
        if ($token) {
            $draft = PaymentApprovalRequest::where('registration_token', $token)
                ->where('status', PaymentApprovalRequest::STATUS_DRAFT)
                ->first();
            if ($draft) {
                $draft->delete();
            }
        }

        $request->session()->forget('onboarding_token');

        return response()->json(['success' => true]);
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
            'registration_token' => ['nullable', 'string', 'max:64'],
        ]);

        $email = strtolower(trim($validated['email']));

        // 1. Check again that email is not already registered as an active user
        if (User::where('email', $email)->exists()) {
            return response()->json([
                'status' => 'registered',
                'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
                'action_url' => route('login'),
            ], 422);
        }

        // 2. Prevent duplicate transaction references across active requests
        $existingTxn = PaymentApprovalRequest::where('transaction_reference', trim($validated['transaction_reference']))
            ->whereIn('status', [PaymentApprovalRequest::STATUS_PENDING, PaymentApprovalRequest::STATUS_APPROVED])
            ->exists();

        if ($existingTxn) {
            throw ValidationException::withMessages([
                'transaction_reference' => 'This transaction ID has already been submitted for verification.',
            ]);
        }

        // 3. Retrieve draft if token or session exists
        $token = $request->session()->get('onboarding_token') ?: $request->input('registration_token');
        $draft = null;
        if ($token) {
            $draft = PaymentApprovalRequest::where('registration_token', $token)
                ->where('status', PaymentApprovalRequest::STATUS_DRAFT)
                ->first();
        }
        if (! $draft) {
            $draft = PaymentApprovalRequest::where('email', $email)
                ->where('status', PaymentApprovalRequest::STATUS_DRAFT)
                ->latest()
                ->first();
        }

        // 4. Prevent multiple pending requests for same email
        $existingPending = PaymentApprovalRequest::where('email', $email)
            ->where('status', PaymentApprovalRequest::STATUS_PENDING)
            ->first();

        if ($existingPending) {
            return response()->json([
                'status' => 'pending_approval',
                'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
                'tracking_url' => route('onboarding.status', ['email' => $email]),
            ], 422);
        }

        // Store receipt in private storage (local disk root = storage/app/private)
        $file = $request->file('receipt');
        $storedPath = Storage::disk('local')->putFile('payment_receipts', $file);

        // Determine price
        $planConfig = config("manual_payment.plans.{$validated['plan_slug']}", []);
        $amountCents = (int) ($planConfig['monthly_cents'] ?? 1900);
        if ($validated['billing_interval'] === 'annual' && ! empty($planConfig['yearly_cents'])) {
            $amountCents = (int) $planConfig['yearly_cents'];
        }

        try {
            DB::beginTransaction();

            $token = $token ?: Str::random(40);

            if ($draft) {
                $draft->update([
                    'email' => $email,
                    'pending_email' => $email,
                    'registration_token' => $token,
                    'current_step' => 5,
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
                $approvalRequest = $draft;
            } else {
                $approvalRequest = PaymentApprovalRequest::create([
                    'email' => $email,
                    'pending_email' => $email,
                    'registration_token' => $token,
                    'current_step' => 5,
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
            }

            DB::commit();
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            if ($e->getCode() === '23000') {
                return response()->json([
                    'status' => 'pending_approval',
                    'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
                    'tracking_url' => route('onboarding.status', ['email' => $email]),
                ], 422);
            }
            throw $e;
        }

        $request->session()->put('onboarding_token', $token);

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
     * Track Payment Application Status (Securely gated behind email OTP or signed link).
     */
    public function status(Request $request): Response|JsonResponse
    {
        $email = $request->query('email') ? strtolower(trim($request->query('email'))) : null;
        $sessionVerifiedEmail = $request->session()->get('tracking_verified_email');

        $isVerified = false;
        $approvalRequest = null;

        if ($email && $sessionVerifiedEmail && $email === strtolower(trim($sessionVerifiedEmail))) {
            $isVerified = true;
            $approvalRequest = PaymentApprovalRequest::where('email', $email)
                ->orWhere('pending_email', $email)
                ->latest('id')
                ->first();
        }

        if ($request->wantsJson()) {
            if (! $isVerified) {
                return response()->json([
                    'verified' => false,
                    'message' => 'Verification required before application details can be viewed.',
                ], 403);
            }

            if (! $approvalRequest) {
                return response()->json([
                    'verified' => true,
                    'found' => false,
                    'message' => 'No registration records found for this email.',
                ], 404);
            }

            $details = $this->formatTrackingDetails($approvalRequest);
            return response()->json([
                'verified' => true,
                'found' => true,
                'id' => $approvalRequest->id,
                'email' => $approvalRequest->email,
                'status' => $approvalRequest->status,
                'rejection_reason' => $approvalRequest->rejection_reason,
                'completion_url' => $details['completion_url'] ?? null,
                'application' => $details,
            ]);
        }

        return Inertia::render('auth/onboarding-status', [
            'verified' => $isVerified,
            'searchEmail' => $email ?? '',
            'approvalRequest' => ($isVerified && $approvalRequest) ? $this->formatTrackingDetails($approvalRequest) : null,
        ]);
    }

    /**
     * Request a 6-digit OTP code to securely track an application.
     */
    public function requestTrackingOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
        ]);

        $email = strtolower(trim($validated['email']));

        // Rate limit: 5 requests per 10 minutes per IP
        $rateLimitKey = 'tracking-otp:' . $request->ip() . ':' . $email;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'message' => "Too many verification requests. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }
        RateLimiter::hit($rateLimitKey, 600);

        // Check if an application exists for this email
        $exists = PaymentApprovalRequest::where('email', $email)
            ->orWhere('pending_email', $email)
            ->exists();

        if (! $exists) {
            return response()->json([
                'found' => false,
                'message' => 'No registration or payment application was found for this email address. Please make sure you entered the administrative work email used during signup.',
            ], 404);
        }

        // Generate 6-digit OTP
        $otp = (string) random_int(100000, 999999);

        // Store OTP in cache for 15 minutes
        Cache::put("tracking_otp_{$email}", [
            'code' => $otp,
            'attempts' => 0,
        ], now()->addMinutes(15));

        // Generate one-time signed verification link
        $verificationUrl = URL::temporarySignedRoute(
            'onboarding.status.verify-link',
            now()->addMinutes(15),
            ['email' => $email]
        );

        // Send Email
        rescue(function () use ($email, $otp, $verificationUrl) {
            Mail::to($email)->send(new TrackingVerificationCodeMail($otp, $verificationUrl, $email, 15));
        }, report: false);

        return response()->json([
            'sent' => true,
            'email' => $email,
            'message' => 'A 6-digit verification code has been sent to your email address.',
        ]);
    }

    /**
     * Verify the 6-digit OTP code and unlock the application details.
     */
    public function verifyTrackingOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $email = strtolower(trim($validated['email']));
        $code = trim($validated['code']);

        $cached = Cache::get("tracking_otp_{$email}");

        if (! $cached) {
            return response()->json([
                'message' => 'The verification code has expired or was not requested. Please request a new code.',
            ], 422);
        }

        if (($cached['attempts'] ?? 0) >= 5) {
            Cache::forget("tracking_otp_{$email}");
            return response()->json([
                'message' => 'Too many invalid attempts. For your security, this code has been invalidated. Please request a new code.',
            ], 422);
        }

        if ($cached['code'] !== $code) {
            $cached['attempts'] = ($cached['attempts'] ?? 0) + 1;
            Cache::put("tracking_otp_{$email}", $cached, now()->addMinutes(15));

            $remaining = 5 - $cached['attempts'];
            return response()->json([
                'message' => "Invalid verification code. Please check your email and try again ({$remaining} attempts remaining).",
            ], 422);
        }

        // Verified successfully!
        Cache::forget("tracking_otp_{$email}");
        $request->session()->put('tracking_verified_email', $email);

        $approvalRequest = PaymentApprovalRequest::where('email', $email)
            ->orWhere('pending_email', $email)
            ->latest('id')
            ->first();

        if (! $approvalRequest) {
            return response()->json([
                'found' => false,
                'message' => 'No registration records found for this email.',
            ], 404);
        }

        $details = $this->formatTrackingDetails($approvalRequest);
        return response()->json([
            'verified' => true,
            'found' => true,
            'id' => $approvalRequest->id,
            'email' => $approvalRequest->email,
            'status' => $approvalRequest->status,
            'rejection_reason' => $approvalRequest->rejection_reason,
            'completion_url' => $details['completion_url'] ?? null,
            'application' => $details,
        ]);
    }

    /**
     * One-time signed link verification entrypoint.
     */
    public function verifyTrackingLink(Request $request): RedirectResponse
    {
        if (! $request->hasValidSignature()) {
            return redirect()->route('onboarding.status')
                ->with('error', 'This tracking verification link is invalid or has expired. Please enter your email to request a new code.');
        }

        $email = strtolower(trim($request->query('email', '')));
        if (! empty($email)) {
            $request->session()->put('tracking_verified_email', $email);
        }

        return redirect()->route('onboarding.status', ['email' => $email]);
    }

    /**
     * Format tracking details for applicant status view across all 5 states.
     */
    protected function formatTrackingDetails(PaymentApprovalRequest $approvalRequest): array
    {
        $isCompleted = $approvalRequest->isCompleted();
        $isApproved = $approvalRequest->isApproved();
        $isPending = $approvalRequest->isPending();
        $isRejected = $approvalRequest->isRejected();

        if ($isCompleted) {
            return [
                'id' => $approvalRequest->id,
                'email' => $approvalRequest->email,
                'plan_name' => $approvalRequest->planDisplayName(),
                'billing_interval' => $approvalRequest->billing_interval ?: 'monthly',
                'amount_formatted' => $approvalRequest->formattedAmount(),
                'transaction_reference' => $approvalRequest->transaction_reference ?: 'N/A',
                'status' => 'completed',
                'status_label' => 'Workspace Activated',
                'badge_style' => 'emerald',
                'title' => 'Your institution workspace is fully active.',
                'description' => 'Your campus account has been provisioned. You can sign in using your administrative work credentials.',
                'action' => 'login',
                'action_url' => route('login'),
                'action_label' => 'Sign In to Your Workspace',
                'submitted_at' => $approvalRequest->created_at->format('M d, Y h:i A'),
                'approved_at' => $approvalRequest->approved_at?->format('M d, Y h:i A'),
                'completed_at' => $approvalRequest->completed_at?->format('M d, Y h:i A'),
            ];
        }

        if ($isApproved) {
            $token = $approvalRequest->ensureValidCompletionToken();
            return [
                'id' => $approvalRequest->id,
                'email' => $approvalRequest->email,
                'plan_name' => $approvalRequest->planDisplayName(),
                'billing_interval' => $approvalRequest->billing_interval ?: 'monthly',
                'amount_formatted' => $approvalRequest->formattedAmount(),
                'transaction_reference' => $approvalRequest->transaction_reference ?: 'N/A',
                'status' => 'awaiting_institution_details',
                'status_label' => 'Approved — Awaiting Institution Setup',
                'badge_style' => 'emerald',
                'title' => 'Congratulations! Your payment proof has been approved.',
                'description' => 'Your 30-day free trial has been unlocked. Click the button below to choose your password, school name, and custom campus subdomain.',
                'action' => 'complete_account',
                'action_url' => url("/onboarding/complete/{$token}"),
                'action_label' => 'Complete Account & Setup Institution',
                'completion_url' => url("/onboarding/complete/{$token}"),
                'submitted_at' => $approvalRequest->created_at->format('M d, Y h:i A'),
                'approved_at' => $approvalRequest->approved_at?->format('M d, Y h:i A'),
            ];
        }

        if ($isPending) {
            return [
                'id' => $approvalRequest->id,
                'email' => $approvalRequest->email,
                'plan_name' => $approvalRequest->planDisplayName(),
                'billing_interval' => $approvalRequest->billing_interval ?: 'monthly',
                'amount_formatted' => $approvalRequest->formattedAmount(),
                'transaction_reference' => $approvalRequest->transaction_reference ?: 'N/A',
                'status' => 'under_review',
                'status_label' => 'Under Review / Pending Verification',
                'badge_style' => 'amber',
                'title' => 'Your payment proof is under active verification.',
                'description' => 'Our finance desk is matching your transaction reference with bank deposit logs. Once verified, you will be able to complete your workspace setup.',
                'action' => null,
                'action_url' => null,
                'action_label' => null,
                'submitted_at' => $approvalRequest->created_at->format('M d, Y h:i A'),
            ];
        }

        if ($isRejected) {
            return [
                'id' => $approvalRequest->id,
                'email' => $approvalRequest->email,
                'plan_name' => $approvalRequest->planDisplayName(),
                'billing_interval' => $approvalRequest->billing_interval ?: 'monthly',
                'amount_formatted' => $approvalRequest->formattedAmount(),
                'transaction_reference' => $approvalRequest->transaction_reference ?: 'N/A',
                'status' => 'rejected',
                'status_label' => 'Payment Proof Rejected',
                'badge_style' => 'rose',
                'title' => 'Payment Verification Notice',
                'description' => 'Our finance desk could not verify your payment proof with bank deposit logs.',
                'rejection_reason' => $approvalRequest->rejection_reason ?: 'Unable to verify payment reference with bank records.',
                'action' => 'resubmit',
                'action_url' => url('/register?email=' . urlencode($approvalRequest->email)),
                'action_label' => 'Submit Corrected Payment Proof',
                'submitted_at' => $approvalRequest->created_at->format('M d, Y h:i A'),
                'rejected_at' => $approvalRequest->rejected_at?->format('M d, Y h:i A'),
            ];
        }

        // Draft / Pending Payment
        return [
            'id' => $approvalRequest->id,
            'email' => $approvalRequest->email,
            'plan_name' => $approvalRequest->planDisplayName(),
            'billing_interval' => $approvalRequest->billing_interval ?: 'monthly',
            'amount_formatted' => $approvalRequest->formattedAmount(),
            'transaction_reference' => $approvalRequest->transaction_reference ?: 'Unsubmitted',
            'status' => 'pending_payment',
            'status_label' => 'Pending Payment Proof',
            'badge_style' => 'amber',
            'title' => 'Payment Proof Required',
            'description' => 'You started registration for the ' . $approvalRequest->planDisplayName() . ' plan, but payment proof has not yet been submitted. Please upload your deposit slip or transfer screenshot to submit your application.',
            'action' => 'resume_registration',
            'action_url' => url('/register?email=' . urlencode($approvalRequest->email) . '&step=' . max(2, (int) ($approvalRequest->current_step ?: 4))),
            'action_label' => 'Resume Application & Submit Proof',
            'submitted_at' => $approvalRequest->created_at->format('M d, Y h:i A'),
        ];
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
                'pending_email' => null,
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
