<?php

namespace App\Services\Billing;

use App\Contracts\PaymentGatewayInterface;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\Request;

class PlaceholderGateway implements PaymentGatewayInterface
{
    public function getGatewayName(): string
    {
        return 'pending_integration';
    }

    public function isConfigured(): bool
    {
        return false;
    }

    public function createCustomer(User $user, Organization $organization, array $options = []): array
    {
        return [
            'id' => 'cus_pending_' . $user->id,
            'email' => $user->email,
            'name' => $user->name,
        ];
    }

    public function getCustomer(string $customerId): ?array
    {
        return null;
    }

    public function createSetupSession(User $user, Organization $organization, array $options = []): array
    {
        return [
            'success' => false,
            'message' => 'Online payment method verification is currently pending provider integration. No card details are stored on our servers.',
        ];
    }

    public function verifyPaymentMethod(string $paymentMethodId): array
    {
        return [
            'verified' => false,
            'message' => 'Payment gateway verification is not active. Real-time verification requires live payment provider credentials.',
        ];
    }

    public function createCheckoutSession(OrganizationSubscription $subscription, SubscriptionPlan $plan, array $options = []): array
    {
        return [
            'success' => false,
            'configured' => false,
            'message' => 'Online payment provider integration is postponed. Please submit a manual invoice request or contact sales for billing assistance.',
        ];
    }

    public function cancelSubscription(string $gatewaySubscriptionId): bool
    {
        return false;
    }

    public function verifyWebhookSignature(Request $request): bool
    {
        return false;
    }

    public function handleWebhook(Request $request): array
    {
        return [
            'handled' => false,
            'event_type' => 'unsupported',
            'message' => 'Placeholder gateway does not accept live webhook traffic.',
        ];
    }
}
