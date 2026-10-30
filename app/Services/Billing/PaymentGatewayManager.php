<?php

namespace App\Services\Billing;

use App\Contracts\PaymentGatewayInterface;
use App\Models\OrganizationSubscription;
use App\Models\PaymentTransaction;
use App\Models\SubscriptionInvoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentGatewayManager
{
    /**
     * Resolve the active payment gateway driver.
     */
    public function gateway(?string $name = null): PaymentGatewayInterface
    {
        $name = $name ?: config('billing.default_gateway', 'placeholder');

        return match ($name) {
            'placeholder' => new PlaceholderGateway(),
            default => new PlaceholderGateway(),
        };
    }

    /**
     * Dispatch an incoming gateway webhook request to the configured gateway driver.
     * Validates gateway configuration and signature before processing.
     */
    public function handleWebhook(\Illuminate\Http\Request $request, ?string $gatewayName = null): array
    {
        $gateway = $this->gateway($gatewayName);

        if (! $gateway->isConfigured()) {
            abort(400, "Payment gateway '{$gateway->getGatewayName()}' is not configured to accept live webhook events.");
        }

        return $gateway->handleWebhook($request);
    }

    /**
     * Process a verified payment event idempotently.
     */
    public function processPaymentEvent(
        string $reference,
        OrganizationSubscription $subscription,
        ?SubscriptionInvoice $invoice,
        string $gateway,
        string $eventType,
        int $amountCents,
        string $currency = 'USD',
        array $payload = []
    ): PaymentTransaction {
        // Integrity validation: amount must be positive
        if ($amountCents <= 0) {
            throw new \InvalidArgumentException('Invalid transaction amount: amount must be greater than zero.');
        }

        // Validate invoice relationship, currency, and amount
        if ($invoice) {
            if ($invoice->organization_id !== $subscription->organization_id) {
                throw new \InvalidArgumentException('Mismatched invoice: invoice does not belong to the subscription organization.');
            }

            if ($currency && strtoupper($currency) !== strtoupper($invoice->currency)) {
                throw new \InvalidArgumentException("Currency mismatch: expected {$invoice->currency}, received {$currency}.");
            }

            if ($amountCents < $invoice->amount_cents) {
                throw new \InvalidArgumentException("Underpayment detected: expected {$invoice->amount_cents} cents, received {$amountCents} cents.");
            }
        }

        // Idempotency: return existing transaction if already processed
        $existing = PaymentTransaction::where('transaction_reference', $reference)->first();
        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use (
            $reference,
            $subscription,
            $invoice,
            $gateway,
            $eventType,
            $amountCents,
            $currency,
            $payload
        ) {
            $transaction = PaymentTransaction::create([
                'transaction_reference' => $reference,
                'subscription_id' => $subscription->id,
                'invoice_id' => $invoice?->id,
                'gateway' => $gateway,
                'event_type' => $eventType,
                'amount_cents' => $amountCents,
                'currency' => strtoupper($currency),
                'status' => 'processed',
                'payload' => $payload,
                'processed_at' => now(),
            ]);

            // Activate subscription
            $subscription->update([
                'status' => OrganizationSubscription::STATUS_ACTIVE,
                'starts_at' => now(),
                'ends_at' => now()->addMonth(),
            ]);

            // Mark invoice as paid if present
            if ($invoice && ! $invoice->isPaid()) {
                $invoice->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payment_reference' => $reference,
                ]);
            }

            return $transaction;
        });
    }

    /**
     * Platform Super Admin manual payment verification workflow.
     */
    public function verifyManualPayment(
        SubscriptionInvoice $invoice,
        User $verifier,
        string $paymentReference,
        ?string $notes = null
    ): SubscriptionInvoice {
        if (! $verifier->isSuperAdmin()) {
            throw new InvalidArgumentException('Unauthorized. Only platform Super Administrators may verify manual payments.');
        }

        return DB::transaction(function () use ($invoice, $verifier, $paymentReference, $notes) {
            $invoice->update([
                'status' => 'paid',
                'payment_reference' => $paymentReference,
                'notes' => $notes ?: $invoice->notes,
                'verified_by' => $verifier->id,
                'verified_at' => now(),
                'paid_at' => now(),
            ]);

            // Activate subscription
            $subscription = $invoice->subscription ?: $invoice->organization->subscription;
            if ($subscription) {
                $subscription->update([
                    'status' => OrganizationSubscription::STATUS_ACTIVE,
                    'billing_type' => 'manual_invoice',
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(),
                ]);

                // Record idempotent audit transaction
                PaymentTransaction::firstOrCreate(
                    ['transaction_reference' => $paymentReference],
                    [
                        'subscription_id' => $subscription->id,
                        'invoice_id' => $invoice->id,
                        'gateway' => 'manual',
                        'event_type' => 'manual.verified',
                        'amount_cents' => $invoice->amount_cents,
                        'currency' => $invoice->currency,
                        'status' => 'succeeded',
                        'payload' => [
                            'verified_by_user_id' => $verifier->id,
                            'verified_by_name' => $verifier->name,
                            'verified_by_email' => $verifier->email,
                            'payment_reference' => $paymentReference,
                            'notes' => $notes,
                        ],
                        'processed_at' => now(),
                    ]
                );
            }

            return $invoice;
        });
    }
}
