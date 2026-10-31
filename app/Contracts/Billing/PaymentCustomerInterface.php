<?php

namespace App\Contracts\Billing;

use App\Models\Organization;
use App\Models\User;

interface PaymentCustomerInterface
{
    /**
     * Create or retrieve a gateway customer reference for the tenant owner.
     *
     * @return array{id: string, email: string, name?: string}
     */
    public function createCustomer(User $user, Organization $organization, array $options = []): array;

    /**
     * Retrieve customer details by gateway customer ID.
     */
    public function getCustomer(string $customerId): ?array;
}
