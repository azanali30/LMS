<?php

namespace App\Services\Billing;

use App\Contracts\PaymentGatewayInterface;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class PlaceholderGateway implements PaymentGatewayInterface
{
    public function getGatewayName(): string
    {
        return 'placeholder';
    }

    public function isConfigured(): bool
    {
        return false;
    }

    public function createCheckoutSession(OrganizationSubscription $subscription, SubscriptionPlan $plan, array $options = []): array
    {
        return [
            'success' => false,
            'configured' => false,
            'message' => 'Online payment gateway credentials have not yet been finalized. Please submit a manual invoice request or contact our enterprise sales team.',
        ];
    }

    public function handleWebhook(Request $request): array
    {
        return [
            'handled' => false,
            'event_type' => 'unsupported',
            'message' => 'Placeholder gateway does not accept webhook events.',
        ];
    }
}
