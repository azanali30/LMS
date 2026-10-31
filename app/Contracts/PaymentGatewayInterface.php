<?php

namespace App\Contracts;

use App\Contracts\Billing\PaymentCustomerInterface;
use App\Contracts\Billing\PaymentMethodInterface;
use App\Contracts\Billing\PaymentWebhookInterface;
use App\Contracts\Billing\SubscriptionCheckoutInterface;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

interface PaymentGatewayInterface extends
    PaymentCustomerInterface,
    PaymentMethodInterface,
    SubscriptionCheckoutInterface,
    PaymentWebhookInterface
{
    /**
     * Get the identifier name of this gateway driver.
     */
    public function getGatewayName(): string;

    /**
     * Determine whether the gateway credentials and keys are configured.
     */
    public function isConfigured(): bool;
}
