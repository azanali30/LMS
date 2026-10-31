<?php

namespace App\Contracts\Billing;

use App\Models\Organization;
use App\Models\User;

interface PaymentMethodInterface
{
    /**
     * Generate a secure setup session / client secret for payment method collection.
     * Raw credentials or card numbers MUST NEVER pass through the application server.
     *
     * @return array{success: bool, client_secret?: string, setup_url?: string, message?: string}
     */
    public function createSetupSession(User $user, Organization $organization, array $options = []): array;

    /**
     * Server-side verification of payment method from payment provider.
     *
     * @return array{verified: bool, reference?: string, brand?: string, last4?: string, message?: string}
     */
    public function verifyPaymentMethod(string $paymentMethodId): array;
}
