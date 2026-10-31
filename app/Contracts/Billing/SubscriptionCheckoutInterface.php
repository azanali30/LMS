<?php

namespace App\Contracts\Billing;

use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;

interface SubscriptionCheckoutInterface
{
    /**
     * Create a checkout session for subscription billing.
     *
     * @return array{success: bool, configured: bool, checkout_url?: string, message?: string}
     */
    public function createCheckoutSession(OrganizationSubscription $subscription, SubscriptionPlan $plan, array $options = []): array;

    /**
     * Cancel recurring subscription with the payment gateway.
     */
    public function cancelSubscription(string $gatewaySubscriptionId): bool;
}
