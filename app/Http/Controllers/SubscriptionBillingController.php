<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\Billing\PaymentGatewayManager;
use App\Services\Billing\SubscriptionService;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionBillingController extends Controller
{
    public function __construct(
        protected PaymentGatewayManager $gatewayManager,
        protected SubscriptionService $subscriptionService
    ) {}

    private function resolveOrganization(Request $request, ?User $user): ?Organization
    {
        $orgId = $request->input('organization_id') ?: $request->query('organization_id');
        if ($orgId) {
            $org = Organization::find($orgId);
            if ($org) {
                return $org;
            }
        }

        return TenantContext::current() ?? $user?->currentOrganization();
    }

    /**
     * View subscription overview, entitlements, and invoice history.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $organization = $this->resolveOrganization($request, $user);
        if (! $organization) {
            abort(404, 'No active organization found.');
        }

        $isOwnerOrAdmin = $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) || $user->isSuperAdmin();
        if (! $isOwnerOrAdmin) {
            abort(403, 'Unauthorized. Only organization Owners and Admins can access billing.');
        }

        $subscription = $organization->subscription()->with(['plan', 'histories.fromPlan', 'histories.toPlan'])->first();

        $ownedCount = $user->organizations()->wherePivot('role', 'owner')->count();
        $maxLimit = $user->maxOrganizationEntitlement();

        $invoices = $organization->subscriptionInvoices()
            ->with(['plan', 'verifier'])
            ->latest()
            ->get();

        $transactions = $subscription
            ? $subscription->transactions()->latest()->take(10)->get()
            : [];

        $histories = $subscription
            ? $subscription->histories()->with(['fromPlan', 'toPlan', 'user'])->latest()->take(10)->get()
            : [];

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
                'is_custom' => $p->isCustomPricing(),
            ]);

        $activeGateway = $this->gatewayManager->gateway();

        return Inertia::render('tenant/billing', [
            'organization' => $organization->only(['id', 'name', 'slug', 'status']),
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'billing_type' => $subscription->billing_type,
                'billing_interval' => $subscription->billing_interval ?: 'monthly',
                'currency' => $subscription->currency ?: 'USD',
                'payment_method' => $subscription->payment_method,
                'payment_method_status' => $subscription->payment_method_status ?: 'unverified',
                'is_pending_payment_method' => $subscription->isPendingPaymentMethod(),
                'is_trialing' => $subscription->isTrialing(),
                'is_expired' => $subscription->isTrialExpired(),
                'is_active' => $subscription->isActive(),
                'days_remaining' => $subscription->daysRemainingInTrial(),
                'starts_at' => $subscription->starts_at?->toIso8601String(),
                'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'cancelled_at' => $subscription->cancelled_at?->toIso8601String(),
                'plan' => $subscription->plan ? [
                    'id' => $subscription->plan->id,
                    'name' => $subscription->plan->name,
                    'slug' => $subscription->plan->slug,
                    'description' => $subscription->plan->description,
                    'max_organizations' => $subscription->plan->max_organizations,
                    'organization_limit' => $subscription->plan->organizationLimit(),
                    'price_cents' => $subscription->plan->price_cents,
                    'price_annual_cents' => $subscription->plan->price_annual_cents,
                    'price_formatted' => $subscription->plan->formattedPrice($subscription->billing_interval ?: 'monthly'),
                    'currency' => $subscription->plan->currency,
                    'billing_interval' => $subscription->plan->billing_interval,
                    'features' => $subscription->plan->features ?: [],
                ] : null,
            ] : null,
            'entitlement' => [
                'owned_organizations_count' => $ownedCount,
                'max_organizations_limit' => $maxLimit,
                'can_create_more' => $user->canCreateOrganization(),
                'limit_text' => $subscription?->plan?->organizationLimit() ?? '1 Institution',
            ],
            'gateway' => [
                'name' => $activeGateway->getGatewayName(),
                'is_configured' => $activeGateway->isConfigured(),
            ],
            'invoices' => $invoices,
            'transactions' => $transactions,
            'histories' => $histories,
            'availablePlans' => $plans,
            'devBypassEnabled' => $this->subscriptionService->isDevBypassPermitted(),
        ]);
    }

    /**
     * Owner changes plan (upgrade / downgrade) or billing interval.
     */
    public function changePlan(Request $request): RedirectResponse
    {
        $user = $request->user();
        $organization = $this->resolveOrganization($request, $user);
        if (! $organization) {
            abort(404);
        }
        if (! $user->hasRoleInOrganization($organization->id, ['owner']) && ! $user->isSuperAdmin()) {
            abort(403, 'Only organization Owners may modify subscription plans.');
        }

        $validated = $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'plan_slug' => 'nullable|string',
            'billing_interval' => 'nullable|string|in:monthly,annual,month,year',
        ]);

        $newPlan = null;
        if (! empty($validated['plan_id'])) {
            $newPlan = SubscriptionPlan::findOrFail($validated['plan_id']);
        } elseif (! empty($validated['plan_slug'])) {
            $newPlan = SubscriptionPlan::findBySlug($validated['plan_slug']);
        }

        if (! $newPlan) {
            abort(422, 'Valid plan_id or plan_slug must be provided.');
        }

        $subscription = $organization->subscription;
        if (! $subscription) {
            abort(404, 'No subscription found for this organization.');
        }

        $this->subscriptionService->changePlan(
            $subscription,
            $newPlan,
            $validated['billing_interval'] ?? $subscription->billing_interval,
            $user
        );

        return back()->with('success', "Subscription updated to {$newPlan->name} ({$subscription->fresh()->billing_interval}) successfully.");
    }

    /**
     * Owner requests subscription cancellation.
     */
    public function cancel(Request $request): RedirectResponse
    {
        $user = $request->user();
        $organization = $this->resolveOrganization($request, $user);
        if (! $organization) {
            abort(404);
        }
        if (! $user->hasRoleInOrganization($organization->id, ['owner']) && ! $user->isSuperAdmin()) {
            abort(403, 'Only organization Owners may cancel subscriptions.');
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        $subscription = $organization->subscription;
        if (! $subscription) {
            abort(404, 'No active subscription found.');
        }

        $this->subscriptionService->cancelSubscription($subscription, $validated['reason'] ?? null, $user);

        return back()->with('success', 'Your subscription has been cancelled. Your school and student records remain preserved.');
    }

    /**
     * Development-only test mechanism for activating a trial without real gateway credentials.
     * Strictly blocked in production.
     */
    public function devTrialActivate(Request $request): RedirectResponse
    {
        $user = $request->user();
        $organization = $this->resolveOrganization($request, $user);
        if (! $organization) {
            abort(404);
        }
        if (! $user->hasRoleInOrganization($organization->id, ['owner']) && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $subscription = $organization->subscription;
        if (! $subscription) {
            abort(404);
        }

        $this->subscriptionService->activateDevTrialBypass($subscription);

        return back()->with('success', 'Local test trial successfully activated for development testing.');
    }

    /**
     * Owner requests a manual invoice or quote for their subscription.
     */
    public function requestManualInvoice(Request $request): RedirectResponse
    {
        $user = $request->user();
        $organization = $this->resolveOrganization($request, $user);
        if (! $organization) {
            abort(404);
        }
        if (! $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'notes' => 'nullable|string|max:1000',
            'billing_interval' => 'nullable|string|in:monthly,annual',
        ]);

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);
        $subscription = $organization->subscription;

        $interval = $validated['billing_interval'] ?? $subscription?->billing_interval ?? 'monthly';
        $amountCents = $plan->priceForInterval($interval);

        $invoiceNumber = 'INV-SUB-' . date('Y') . '-' . strtoupper(Str::random(6));

        SubscriptionInvoice::create([
            'invoice_number' => $invoiceNumber,
            'organization_id' => $organization->id,
            'subscription_id' => $subscription?->id,
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'amount_cents' => $amountCents,
            'currency' => $plan->currency ?: 'USD',
            'billing_type' => 'manual_invoice',
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
            'due_date' => now()->addDays(14),
        ]);

        return back()->with('success', "Manual invoice request {$invoiceNumber} submitted! An InstitutoPropio administrator will process and verify your payment.");
    }

    /**
     * Platform Super Admin verifies payment and activates subscription.
     */
    public function adminVerifyPayment(SubscriptionInvoice $invoice, Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Unauthorized. Only Platform Super Administrators may verify subscription payments.');
        }

        $validated = $request->validate([
            'payment_reference' => 'required|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $this->gatewayManager->verifyManualPayment(
            $invoice,
            $user,
            $validated['payment_reference'],
            $validated['notes'] ?? null
        );

        return back()->with('success', "Payment for invoice {$invoice->invoice_number} verified! Subscription is now active.");
    }
}
