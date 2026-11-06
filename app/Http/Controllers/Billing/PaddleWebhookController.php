<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\PaddleWebhookEvent;
use App\Models\PaymentTransaction;
use App\Models\SubscriptionHistory;
use App\Models\SubscriptionPlan;
use App\Services\PaddleService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaddleWebhookController extends Controller
{
    public function __construct(
        protected PaddleService $paddleService
    ) {}

    /**
     * Handle incoming Paddle Billing webhook.
     */
    public function handle(Request $request): JsonResponse
    {
        $rawBody = (string) $request->getContent();
        $signatureHeader = $request->header('Paddle-Signature');

        // 1. Verify Webhook Signature
        if (! $this->paddleService->verifyWebhookSignature($signatureHeader, $rawBody)) {
            Log::warning('Paddle webhook signature verification failed.', [
                'ip' => $request->ip(),
                'signature' => $signatureHeader,
            ]);

            return response()->json(['error' => 'Invalid webhook signature.'], 400);
        }

        $payload = json_decode($rawBody, true);
        if (! is_array($payload)) {
            return response()->json(['error' => 'Malformed JSON payload.'], 400);
        }

        $eventId = $payload['event_id'] ?? null;
        $eventType = $payload['event_type'] ?? null;
        $data = $payload['data'] ?? [];

        if (empty($eventId) || empty($eventType)) {
            return response()->json(['error' => 'Missing event_id or event_type.'], 400);
        }

        // 2. Strict Idempotency Check
        if (PaddleWebhookEvent::where('event_id', $eventId)->exists()) {
            Log::info("Paddle webhook event {$eventId} ({$eventType}) already processed. Skipping duplicate.", [
                'event_id' => $eventId,
                'event_type' => $eventType,
            ]);

            return response()->json([
                'status' => 'already_processed',
                'event_id' => $eventId,
            ], 200);
        }

        // 3. Process Event within Database Transaction
        DB::beginTransaction();

        try {
            // Record event receipt immediately for audit and idempotency
            PaddleWebhookEvent::create([
                'event_id' => $eventId,
                'event_type' => $eventType,
                'payload' => $payload,
                'processed_at' => now(),
            ]);

            // Dispatch to specific event handler
            match ($eventType) {
                'subscription.created',
                'subscription.activated',
                'subscription.updated',
                'subscription.resumed' => $this->handleSubscriptionActiveOrUpdated($data, $eventType),

                'subscription.canceled' => $this->handleSubscriptionCanceled($data),
                'subscription.paused' => $this->handleSubscriptionPaused($data),

                'transaction.completed',
                'transaction.paid' => $this->handleTransactionCompleted($data),

                'transaction.payment_failed' => $this->handleTransactionPaymentFailed($data),

                default => Log::info("Paddle webhook event unhandled or informational: {$eventType}"),
            };

            DB::commit();

            return response()->json([
                'status' => 'processed',
                'event_id' => $eventId,
                'event_type' => $eventType,
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error("Paddle webhook handling failed for event {$eventId}: ".$e->getMessage(), [
                'exception' => $e,
                'payload' => $payload,
            ]);

            return response()->json(['error' => 'Internal server error processing webhook.'], 500);
        }
    }

    /**
     * Handle subscription created, activated, updated, or resumed.
     */
    protected function handleSubscriptionActiveOrUpdated(array $data, string $eventType): void
    {
        $subscriptionId = $data['id'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $status = strtolower((string) ($data['status'] ?? 'active'));
        $customData = $data['custom_data'] ?? [];

        $organization = $this->resolveOrganization($data);
        if (! $organization) {
            Log::warning('Paddle webhook: unable to resolve organization for subscription.', [
                'subscription_id' => $subscriptionId,
                'custom_data' => $customData,
            ]);

            return;
        }

        $subscription = OrganizationSubscription::where('organization_id', $organization->id)->first();
        if (! $subscription) {
            $subscription = new OrganizationSubscription();
            $subscription->organization_id = $organization->id;
        }

        // Resolve plan
        $plan = $this->resolvePlan($data);
        $oldPlanId = $subscription->plan_id;
        $oldStatus = $subscription->status;

        if ($plan) {
            $subscription->plan_id = $plan->id;
        } elseif (! $subscription->plan_id) {
            // Safe fallback to default active plan (starter/bronze)
            $defaultPlan = SubscriptionPlan::findBySlug('starter') ?? SubscriptionPlan::first();
            $subscription->plan_id = $defaultPlan?->id;
        }

        // Map Paddle status to InstitutoPropio status
        $mappedStatus = match ($status) {
            'active' => OrganizationSubscription::STATUS_ACTIVE,
            'trialing' => OrganizationSubscription::STATUS_TRIALING,
            'past_due' => OrganizationSubscription::STATUS_PAST_DUE,
            'canceled' => OrganizationSubscription::STATUS_CANCELLED,
            'paused' => OrganizationSubscription::STATUS_PAST_DUE,
            default => OrganizationSubscription::STATUS_ACTIVE,
        };

        // Current billing period
        $currentPeriod = $data['current_billing_period'] ?? [];
        $startsAt = ! empty($currentPeriod['starts_at']) ? Carbon::parse($currentPeriod['starts_at']) : ($subscription->starts_at ?? now());
        $endsAt = ! empty($currentPeriod['ends_at']) ? Carbon::parse($currentPeriod['ends_at']) : null;

        // Billing interval
        $billingInterval = $customData['billing_interval'] ?? ($data['billing_cycle']['interval'] ?? 'month');
        $normalizedInterval = in_array(strtolower($billingInterval), ['year', 'annual', 'yearly'], true)
            ? OrganizationSubscription::INTERVAL_ANNUAL
            : OrganizationSubscription::INTERVAL_MONTHLY;

        // Currency
        $currency = strtoupper((string) ($data['currency_code'] ?? 'USD'));

        // Update fields safely
        $subscription->user_id = $customData['user_id'] ?? $subscription->user_id ?? $organization->created_by ?? null;
        $subscription->status = $mappedStatus;
        $subscription->billing_type = 'online';
        $subscription->payment_method = 'paddle';
        $subscription->billing_interval = $normalizedInterval;
        $subscription->currency = $currency;
        $subscription->gateway_customer_id = $customerId ?: $subscription->gateway_customer_id;
        $subscription->gateway_subscription_id = $subscriptionId ?: $subscription->gateway_subscription_id;
        $subscription->payment_method_status = 'verified';
        $subscription->starts_at = $startsAt;
        $subscription->ends_at = $endsAt;

        if ($mappedStatus === OrganizationSubscription::STATUS_ACTIVE) {
            $subscription->cancelled_at = null;
        }

        $subscription->save();

        // Record lifecycle history
        $historyEvent = match ($eventType) {
            'subscription.created' => 'created',
            'subscription.activated' => 'payment_method_verified',
            'subscription.resumed' => 'renewed',
            default => ($oldPlanId && $plan && $oldPlanId !== $plan->id ? 'upgraded' : 'renewed'),
        };

        SubscriptionHistory::create([
            'subscription_id' => $subscription->id,
            'organization_id' => $organization->id,
            'user_id' => $subscription->user_id,
            'event' => $historyEvent,
            'from_plan_id' => $oldPlanId,
            'to_plan_id' => $subscription->plan_id,
            'from_status' => $oldStatus,
            'to_status' => $subscription->status,
            'billing_interval' => $normalizedInterval,
            'metadata' => [
                'gateway' => 'paddle',
                'event_type' => $eventType,
                'paddle_subscription_id' => $subscriptionId,
                'paddle_customer_id' => $customerId,
            ],
        ]);
    }

    /**
     * Handle subscription cancellation.
     */
    protected function handleSubscriptionCanceled(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        $subscription = OrganizationSubscription::where('gateway_subscription_id', $subscriptionId)->first();

        if (! $subscription) {
            $organization = $this->resolveOrganization($data);
            if ($organization) {
                $subscription = OrganizationSubscription::where('organization_id', $organization->id)->first();
            }
        }

        if ($subscription) {
            $oldStatus = $subscription->status;
            $subscription->status = OrganizationSubscription::STATUS_CANCELLED;
            $subscription->cancelled_at = now();
            $subscription->save();

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'organization_id' => $subscription->organization_id,
                'user_id' => $subscription->user_id,
                'event' => 'cancelled',
                'from_status' => $oldStatus,
                'to_status' => OrganizationSubscription::STATUS_CANCELLED,
                'billing_interval' => $subscription->billing_interval,
                'metadata' => [
                    'gateway' => 'paddle',
                    'paddle_subscription_id' => $subscriptionId,
                    'canceled_at' => now()->toIso8601String(),
                ],
            ]);
        }
    }

    /**
     * Handle subscription paused.
     */
    protected function handleSubscriptionPaused(array $data): void
    {
        $subscriptionId = $data['id'] ?? null;
        $subscription = OrganizationSubscription::where('gateway_subscription_id', $subscriptionId)->first();

        if ($subscription) {
            $oldStatus = $subscription->status;
            $subscription->status = OrganizationSubscription::STATUS_PAST_DUE;
            $subscription->save();

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'organization_id' => $subscription->organization_id,
                'user_id' => $subscription->user_id,
                'event' => 'paused',
                'from_status' => $oldStatus,
                'to_status' => OrganizationSubscription::STATUS_PAST_DUE,
                'metadata' => [
                    'gateway' => 'paddle',
                    'paddle_subscription_id' => $subscriptionId,
                ],
            ]);
        }
    }

    /**
     * Handle successful transaction payment.
     */
    protected function handleTransactionCompleted(array $data): void
    {
        $transactionId = $data['id'] ?? null;
        if (! $transactionId) {
            return;
        }

        $subscriptionId = $data['subscription_id'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $totals = $data['details']['totals'] ?? [];
        $totalCents = isset($totals['total']) ? (int) $totals['total'] : 0;
        $currency = strtoupper((string) ($data['currency_code'] ?? 'USD'));

        $organization = $this->resolveOrganization($data);
        $subscription = null;

        if ($subscriptionId) {
            $subscription = OrganizationSubscription::where('gateway_subscription_id', $subscriptionId)->first();
        }

        if (! $subscription && $organization) {
            $subscription = OrganizationSubscription::where('organization_id', $organization->id)->first();
        }

        // Link transaction to subscription if found
        if ($subscription) {
            $subscription->paddle_transaction_id = $transactionId;
            $subscription->payment_method_status = 'verified';
            $subscription->status = OrganizationSubscription::STATUS_ACTIVE;
            $subscription->save();
        }

        // Record idempotent PaymentTransaction
        PaymentTransaction::updateOrCreate(
            ['transaction_reference' => $transactionId],
            [
                'subscription_id' => $subscription?->id,
                'invoice_id' => null,
                'gateway' => 'paddle',
                'event_type' => 'transaction.completed',
                'amount_cents' => $totalCents,
                'currency' => $currency,
                'status' => 'processed',
                'payload' => $data,
                'processed_at' => now(),
            ]
        );
    }

    /**
     * Handle failed transaction payment.
     */
    protected function handleTransactionPaymentFailed(array $data): void
    {
        $transactionId = $data['id'] ?? null;
        if (! $transactionId) {
            return;
        }

        $subscriptionId = $data['subscription_id'] ?? null;
        $totals = $data['details']['totals'] ?? [];
        $totalCents = isset($totals['total']) ? (int) $totals['total'] : 0;
        $currency = strtoupper((string) ($data['currency_code'] ?? 'USD'));

        $subscription = null;
        if ($subscriptionId) {
            $subscription = OrganizationSubscription::where('gateway_subscription_id', $subscriptionId)->first();
        }

        if ($subscription) {
            $subscription->status = OrganizationSubscription::STATUS_PAST_DUE;
            $subscription->save();
        }

        PaymentTransaction::updateOrCreate(
            ['transaction_reference' => $transactionId],
            [
                'subscription_id' => $subscription?->id,
                'invoice_id' => null,
                'gateway' => 'paddle',
                'event_type' => 'transaction.payment_failed',
                'amount_cents' => $totalCents,
                'currency' => $currency,
                'status' => 'failed',
                'payload' => $data,
                'processed_at' => now(),
            ]
        );
    }

    /**
     * Resolve Organization from Paddle event data.
     */
    protected function resolveOrganization(array $data): ?Organization
    {
        $customData = $data['custom_data'] ?? [];

        // 1. By custom_data organization_id
        if (! empty($customData['organization_id'])) {
            $org = Organization::find($customData['organization_id']);
            if ($org) {
                return $org;
            }
        }

        // 2. By gateway_subscription_id
        $subscriptionId = $data['id'] ?? ($data['subscription_id'] ?? null);
        if ($subscriptionId) {
            $sub = OrganizationSubscription::where('gateway_subscription_id', $subscriptionId)->first();
            if ($sub && $sub->organization) {
                return $sub->organization;
            }
        }

        // 3. By customer_id
        $customerId = $data['customer_id'] ?? null;
        if ($customerId) {
            $sub = OrganizationSubscription::where('gateway_customer_id', $customerId)->first();
            if ($sub && $sub->organization) {
                return $sub->organization;
            }
        }

        return null;
    }

    /**
     * Resolve SubscriptionPlan from Paddle event data.
     */
    protected function resolvePlan(array $data): ?SubscriptionPlan
    {
        $customData = $data['custom_data'] ?? [];

        // 1. By plan_id in custom_data
        if (! empty($customData['plan_id'])) {
            $plan = SubscriptionPlan::find($customData['plan_id']);
            if ($plan) {
                return $plan;
            }
        }

        // 2. By plan_slug in custom_data
        if (! empty($customData['plan_slug'])) {
            $plan = SubscriptionPlan::findBySlug($customData['plan_slug']);
            if ($plan) {
                return $plan;
            }
        }

        // 3. By item price ID in data items
        $items = $data['items'] ?? [];
        foreach ($items as $item) {
            $priceId = $item['price']['id'] ?? ($item['price_id'] ?? null);
            if ($priceId) {
                $plan = SubscriptionPlan::where('paddle_price_id_monthly', $priceId)
                    ->orWhere('paddle_price_id_annual', $priceId)
                    ->first();
                if ($plan) {
                    return $plan;
                }
            }
        }

        return null;
    }
}

