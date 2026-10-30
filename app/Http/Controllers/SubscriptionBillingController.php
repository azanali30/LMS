<?php

namespace App\Http\Controllers;

use App\Models\OrganizationSubscription;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Services\Billing\PaymentGatewayManager;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionBillingController extends Controller
{
    public function __construct(
        protected PaymentGatewayManager $gatewayManager
    ) {}

    /**
     * View subscription overview, entitlements, and invoice history.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $organization = TenantContext::current() ?? $user?->currentOrganization();
        if (! $organization) {
            abort(404, 'No active organization found.');
        }

        $user = $request->user();
        $isOwnerOrAdmin = $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) || $user->isSuperAdmin();
        if (! $isOwnerOrAdmin) {
            abort(403, 'Unauthorized. Only organization Owners and Admins can access billing.');
        }

        $subscription = $organization->subscription()->with('plan')->first();

        $ownedCount = $user->organizations()->wherePivot('role', 'owner')->count();
        $maxLimit = $user->maxOrganizationEntitlement();

        $invoices = $organization->subscriptionInvoices()
            ->with(['plan', 'verifier'])
            ->latest()
            ->get();

        $transactions = $subscription
            ? $subscription->transactions()->latest()->take(10)->get()
            : [];

        $plans = SubscriptionPlan::where('is_active', true)->get();
        $activeGateway = $this->gatewayManager->gateway();

        return Inertia::render('tenant/billing', [
            'organization' => $organization->only(['id', 'name', 'slug', 'status']),
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'billing_type' => $subscription->billing_type,
                'is_trialing' => $subscription->isTrialing(),
                'is_expired' => $subscription->isTrialExpired(),
                'days_remaining' => $subscription->daysRemainingInTrial(),
                'starts_at' => $subscription->starts_at?->toIso8601String(),
                'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'plan' => $subscription->plan ? [
                    'id' => $subscription->plan->id,
                    'name' => $subscription->plan->name,
                    'slug' => $subscription->plan->slug,
                    'description' => $subscription->plan->description,
                    'max_organizations' => $subscription->plan->max_organizations,
                    'organization_limit' => $subscription->plan->organizationLimit(),
                    'price_cents' => $subscription->plan->price_cents,
                    'currency' => $subscription->plan->currency,
                    'billing_interval' => $subscription->plan->billing_interval,
                    'features' => $subscription->plan->features ?: [],
                ] : null,
            ] : null,
            'entitlement' => [
                'owned_organizations_count' => $ownedCount,
                'max_organizations_limit' => $maxLimit,
                'can_create_more' => $user->canCreateOrganization(),
            ],
            'gateway' => [
                'name' => $activeGateway->getGatewayName(),
                'is_configured' => $activeGateway->isConfigured(),
            ],
            'invoices' => $invoices,
            'transactions' => $transactions,
            'availablePlans' => $plans,
        ]);
    }

    /**
     * Owner requests a manual invoice or quote for their subscription.
     */
    public function requestManualInvoice(Request $request): RedirectResponse
    {
        $user = $request->user();
        $organization = TenantContext::current() ?? $user?->currentOrganization();
        if (! $organization) {
            abort(404);
        }
        if (! $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);
        $subscription = $organization->subscription;

        $invoiceNumber = 'INV-SUB-' . date('Y') . '-' . strtoupper(Str::random(6));

        SubscriptionInvoice::create([
            'invoice_number' => $invoiceNumber,
            'organization_id' => $organization->id,
            'subscription_id' => $subscription?->id,
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'amount_cents' => $plan->price_cents,
            'currency' => $plan->currency ?: 'USD',
            'billing_type' => 'manual_invoice',
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
            'due_date' => now()->addDays(14),
        ]);

        return back()->with('success', "Manual invoice request {$invoiceNumber} submitted! A platform administrator will process and verify your payment.");
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
