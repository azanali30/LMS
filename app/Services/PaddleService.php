<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class PaddleService
{
    /**
     * Get the active Paddle environment (sandbox or live).
     */
    public function getEnvironment(): string
    {
        return (string) config('paddle.environment', 'sandbox');
    }

    /**
     * Check if currently configured for sandbox mode.
     */
    public function isSandbox(): bool
    {
        return strtolower($this->getEnvironment()) === 'sandbox';
    }

    /**
     * Get client-side token for Paddle.js frontend initialization.
     */
    public function getClientSideToken(): ?string
    {
        return config('paddle.client_side_token');
    }

    /**
     * Get secret API key for server-to-server operations.
     */
    public function getApiKey(): ?string
    {
        return config('paddle.api_key');
    }

    /**
     * Get secret for verifying incoming webhook signatures.
     */
    public function getWebhookSecret(): ?string
    {
        return config('paddle.webhook_secret');
    }

    /**
     * Resolve the Paddle Price ID for a given plan and billing interval.
     */
    public function getPriceId(string $planSlug, string $interval = 'monthly'): ?string
    {
        $normalizedSlug = SubscriptionPlan::resolveSlugAlias($planSlug);
        $normalizedInterval = in_array(strtolower($interval), ['annual', 'yearly', 'year'], true) ? 'annual' : 'monthly';

        // 1. Check configuration mapping
        $configPrice = config("paddle.prices.{$normalizedSlug}.{$normalizedInterval}");
        if (! empty($configPrice)) {
            return $configPrice;
        }

        // 2. Check database model columns
        $plan = SubscriptionPlan::findBySlug($normalizedSlug);
        if ($plan) {
            $column = $normalizedInterval === 'annual' ? 'paddle_price_id_annual' : 'paddle_price_id_monthly';
            if (! empty($plan->$column)) {
                return $plan->$column;
            }
        }

        return null;
    }

    /**
     * Verify incoming Paddle Billing webhook signature using HMAC-SHA256.
     *
     * Paddle Billing v2 signature header format:
     *   Paddle-Signature: ts=1671542152;h1=5c8f...
     */
    public function verifyWebhookSignature(?string $signatureHeader, string $rawBody, int $tolerance = 300): bool
    {
        $secret = $this->getWebhookSecret();

        if (empty($signatureHeader) || empty($secret)) {
            return false;
        }

        $parts = explode(';', $signatureHeader);
        $parsed = [];

        foreach ($parts as $part) {
            $pair = explode('=', trim($part), 2);
            if (count($pair) === 2) {
                $parsed[$pair[0]] = $pair[1];
            }
        }

        if (! isset($parsed['ts']) || ! isset($parsed['h1'])) {
            return false;
        }

        $ts = (int) $parsed['ts'];
        $signature = $parsed['h1'];

        // Prevent replay attacks by checking timestamp drift (if tolerance > 0)
        if ($tolerance > 0 && abs(time() - $ts) > $tolerance) {
            Log::warning('Paddle webhook signature rejected: timestamp out of tolerance window', [
                'ts' => $ts,
                'server_time' => time(),
                'diff' => abs(time() - $ts),
            ]);

            return false;
        }

        $signedPayload = "{$ts}:{$rawBody}";
        $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);

        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Build client-side checkout parameters for launching Paddle.js checkout.
     */
    public function buildCheckoutParameters(
        Organization $organization,
        User $user,
        SubscriptionPlan $plan,
        string $interval = 'monthly'
    ): array {
        $priceId = $this->getPriceId($plan->slug, $interval);

        return [
            'environment' => $this->getEnvironment(),
            'client_token' => $this->getClientSideToken(),
            'price_id' => $priceId,
            'plan' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price_cents' => $plan->priceForInterval($interval),
                'interval' => $interval,
            ],
            'customer' => [
                'email' => $user->email,
                'name' => $user->name,
            ],
            'custom_data' => [
                'organization_id' => $organization->id,
                'organization_name' => $organization->name,
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'plan_slug' => $plan->slug,
                'billing_interval' => $interval,
            ],
        ];
    }
}

