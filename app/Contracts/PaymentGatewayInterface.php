<?php

namespace App\Contracts;

use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Get the identifier name of this gateway driver.
     */
    public function getGatewayName(): string;

    /**
     * Determine whether the gateway credentials and keys are configured.
     */
    public function isConfigured(): bool;

    /**
     * Initiate a checkout session or payment intent for a subscription.
     *
     * @return array{success: bool, configured: bool, checkout_url?: string, message?: string}
     */
    public function createCheckoutSession(OrganizationSubscription $subscription, SubscriptionPlan $plan, array $options = []): array;

    /**
     * Process an incoming signed webhook from the gateway.
     * Must be idempotent and validate payload, currency, and transaction references.
     *
     * @return array{handled: bool, event_type: string, transaction_reference?: string, message?: string}
     */
    public function handleWebhook(Request $request): array;
}
