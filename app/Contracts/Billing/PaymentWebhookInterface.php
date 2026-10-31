<?php

namespace App\Contracts\Billing;

use Illuminate\Http\Request;

interface PaymentWebhookInterface
{
    /**
     * Verify the cryptographic signature of an incoming webhook.
     */
    public function verifyWebhookSignature(Request $request): bool;

    /**
     * Parse and process a verified webhook payload.
     *
     * @return array{handled: bool, event_type: string, transaction_reference?: string, message?: string}
     */
    public function handleWebhook(Request $request): array;
}
