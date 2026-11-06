<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\PaddleWebhookEvent;
use App\Models\PaymentTransaction;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class PaddleBillingSandboxIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected string $webhookSecret = 'test_pdl_whsec_1234567890abcdef';
    protected SubscriptionPlan $starterPlan;
    protected SubscriptionPlan $growthPlan;
    protected Organization $organization;
    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('paddle.webhook_secret', $this->webhookSecret);
        Config::set('paddle.environment', 'sandbox');
        Config::set('paddle.client_side_token', 'test_client_token_xyz');
        Config::set('paddle.prices.starter.monthly', 'pri_starter_mo_123');
        Config::set('paddle.prices.starter.annual', 'pri_starter_yr_123');
        Config::set('paddle.prices.growth.monthly', 'pri_growth_mo_456');

        $this->starterPlan = SubscriptionPlan::create([
            'name' => 'Bronze (Starter)',
            'slug' => 'starter',
            'description' => '1 Institution',
            'price_cents' => 1900,
            'price_annual_cents' => 19000,
            'currency' => 'USD',
            'billing_interval' => 'month',
            'max_organizations' => 1,
            'max_students' => 0,
            'max_teachers' => 0,
            'max_courses' => 0,
            'is_active' => true,
            'paddle_price_id_monthly' => 'pri_starter_mo_123',
            'paddle_price_id_annual' => 'pri_starter_yr_123',
        ]);

        $this->growthPlan = SubscriptionPlan::create([
            'name' => 'Silver (Growth)',
            'slug' => 'growth',
            'description' => 'Up to 5 Institutions',
            'price_cents' => 4900,
            'price_annual_cents' => 49000,
            'currency' => 'USD',
            'billing_interval' => 'month',
            'max_organizations' => 5,
            'max_students' => 0,
            'max_teachers' => 0,
            'max_courses' => 0,
            'is_active' => true,
            'paddle_price_id_monthly' => 'pri_growth_mo_456',
        ]);

        $this->owner = User::factory()->create([
            'name' => 'Campus Director',
            'email' => 'director@oakridge.edu',
            'role' => 'owner',
        ]);

        $this->organization = Organization::create([
            'name' => 'Oakridge Academy',
            'slug' => 'oakridge-academy',
            'created_by' => $this->owner->id,
            'organization_type' => 'school',
            'status' => 'active',
        ]);

        $this->organization->members()->attach($this->owner->id, [
            'role' => 'owner',
            'status' => 'active',
            'title' => 'Director',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Helper to compute valid Paddle-Signature header for a body.
     */
    protected function computeSignature(string $rawBody, ?int $timestamp = null): string
    {
        $ts = $timestamp ?? time();
        $payload = "{$ts}:{$rawBody}";
        $h1 = hash_hmac('sha256', $payload, $this->webhookSecret);

        return "ts={$ts};h1={$h1}";
    }

    public function test_webhook_rejects_missing_signature(): void
    {
        $payload = json_encode([
            'event_id' => 'evt_test_1',
            'event_type' => 'subscription.activated',
            'data' => [],
        ]);

        $response = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            $payload
        );

        $response->assertStatus(400);
    }

    public function test_webhook_rejects_invalid_signature(): void
    {
        $payload = json_encode([
            'event_id' => 'evt_test_2',
            'event_type' => 'subscription.activated',
            'data' => [],
        ]);

        $response = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => 'ts=1700000000;h1=invalid_hmac_signature',
            ],
            $payload
        );

        $response->assertStatus(400);
    }

    public function test_webhook_rejects_expired_timestamp_out_of_tolerance(): void
    {
        $payload = json_encode([
            'event_id' => 'evt_test_3',
            'event_type' => 'subscription.activated',
            'data' => [],
        ]);

        // 10 minutes in the past
        $expiredTs = time() - 600;
        $signature = $this->computeSignature($payload, $expiredTs);

        $response = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => $signature,
            ],
            $payload
        );

        $response->assertStatus(400);
    }

    public function test_webhook_accepts_valid_signature_and_processes_subscription_activation(): void
    {
        $subscription = OrganizationSubscription::create([
            'organization_id' => $this->organization->id,
            'plan_id' => $this->starterPlan->id,
            'user_id' => $this->owner->id,
            'status' => OrganizationSubscription::STATUS_TRIALING,
            'trial_ends_at' => now()->addDays(30),
        ]);

        $payload = json_encode([
            'event_id' => 'evt_act_001',
            'event_type' => 'subscription.activated',
            'occurred_at' => now()->toIso8601String(),
            'data' => [
                'id' => 'sub_paddle_123',
                'customer_id' => 'ctm_paddle_456',
                'status' => 'active',
                'currency_code' => 'USD',
                'current_billing_period' => [
                    'starts_at' => now()->toIso8601String(),
                    'ends_at' => now()->addMonth()->toIso8601String(),
                ],
                'custom_data' => [
                    'organization_id' => $this->organization->id,
                    'user_id' => $this->owner->id,
                    'plan_id' => $this->growthPlan->id,
                    'plan_slug' => 'growth',
                    'billing_interval' => 'monthly',
                ],
            ],
        ]);

        $signature = $this->computeSignature($payload);

        $response = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => $signature,
            ],
            $payload
        );

        $response->assertOk();
        $response->assertJson([
            'status' => 'processed',
            'event_id' => 'evt_act_001',
        ]);

        $this->assertDatabaseHas('paddle_webhook_events', [
            'event_id' => 'evt_act_001',
            'event_type' => 'subscription.activated',
        ]);

        $subscription->refresh();
        $this->assertEquals(OrganizationSubscription::STATUS_ACTIVE, $subscription->status);
        $this->assertEquals($this->growthPlan->id, $subscription->plan_id);
        $this->assertEquals('sub_paddle_123', $subscription->gateway_subscription_id);
        $this->assertEquals('ctm_paddle_456', $subscription->gateway_customer_id);
        $this->assertEquals('verified', $subscription->payment_method_status);
        $this->assertEquals('paddle', $subscription->payment_method);
    }

    public function test_webhook_idempotency_prevents_duplicate_processing_on_replay(): void
    {
        $payload = json_encode([
            'event_id' => 'evt_idempotent_999',
            'event_type' => 'subscription.activated',
            'data' => [
                'id' => 'sub_dup_111',
                'customer_id' => 'ctm_dup_222',
                'status' => 'active',
                'custom_data' => [
                    'organization_id' => $this->organization->id,
                    'plan_id' => $this->starterPlan->id,
                ],
            ],
        ]);

        $signature = $this->computeSignature($payload);

        // First delivery: processes successfully
        $res1 = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => $signature,
            ],
            $payload
        );
        $res1->assertOk();
        $res1->assertJson(['status' => 'processed']);

        // Second delivery (replay/retry from Paddle): recognized as duplicate, returns 200 without duplicate action
        $res2 = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => $signature,
            ],
            $payload
        );
        $res2->assertOk();
        $res2->assertJson([
            'status' => 'already_processed',
            'event_id' => 'evt_idempotent_999',
        ]);

        $this->assertEquals(1, PaddleWebhookEvent::where('event_id', 'evt_idempotent_999')->count());
    }

    public function test_webhook_handles_subscription_cancellation(): void
    {
        $subscription = OrganizationSubscription::create([
            'organization_id' => $this->organization->id,
            'plan_id' => $this->starterPlan->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'gateway_subscription_id' => 'sub_to_cancel_333',
        ]);

        $payload = json_encode([
            'event_id' => 'evt_cancel_777',
            'event_type' => 'subscription.canceled',
            'data' => [
                'id' => 'sub_to_cancel_333',
                'status' => 'canceled',
            ],
        ]);

        $signature = $this->computeSignature($payload);

        $response = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => $signature,
            ],
            $payload
        );

        $response->assertOk();

        $subscription->refresh();
        $this->assertEquals(OrganizationSubscription::STATUS_CANCELLED, $subscription->status);
        $this->assertNotNull($subscription->cancelled_at);
    }

    public function test_webhook_handles_transaction_completed(): void
    {
        $subscription = OrganizationSubscription::create([
            'organization_id' => $this->organization->id,
            'plan_id' => $this->starterPlan->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'gateway_subscription_id' => 'sub_tx_100',
        ]);

        $payload = json_encode([
            'event_id' => 'evt_txn_100',
            'event_type' => 'transaction.completed',
            'data' => [
                'id' => 'txn_paddle_9999',
                'subscription_id' => 'sub_tx_100',
                'customer_id' => 'ctm_test_999',
                'currency_code' => 'USD',
                'details' => [
                    'totals' => [
                        'total' => '1900',
                    ],
                ],
                'custom_data' => [
                    'organization_id' => $this->organization->id,
                    'plan_id' => $this->starterPlan->id,
                ],
            ],
        ]);

        $signature = $this->computeSignature($payload);

        $response = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => $signature,
            ],
            $payload
        );

        $response->assertOk();

        $this->assertDatabaseHas('payment_transactions', [
            'transaction_reference' => 'txn_paddle_9999',
            'gateway' => 'paddle',
            'status' => 'processed',
            'amount_cents' => 1900,
        ]);

        $subscription->refresh();
        $this->assertEquals('txn_paddle_9999', $subscription->paddle_transaction_id);
    }

    public function test_webhook_handles_transaction_payment_failed(): void
    {
        $subscription = OrganizationSubscription::create([
            'organization_id' => $this->organization->id,
            'plan_id' => $this->starterPlan->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'gateway_subscription_id' => 'sub_fail_200',
        ]);

        $payload = json_encode([
            'event_id' => 'evt_txn_failed_200',
            'event_type' => 'transaction.payment_failed',
            'data' => [
                'id' => 'txn_failed_8888',
                'subscription_id' => 'sub_fail_200',
                'currency_code' => 'USD',
                'details' => [
                    'totals' => ['total' => '1900'],
                ],
            ],
        ]);

        $signature = $this->computeSignature($payload);

        $response = $this->call(
            'POST',
            '/paddle/webhook',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_PADDLE_SIGNATURE' => $signature,
            ],
            $payload
        );

        $response->assertOk();

        $this->assertDatabaseHas('payment_transactions', [
            'transaction_reference' => 'txn_failed_8888',
            'gateway' => 'paddle',
            'status' => 'failed',
        ]);

        $subscription->refresh();
        $this->assertEquals(OrganizationSubscription::STATUS_PAST_DUE, $subscription->status);
    }

    public function test_paddle_checkout_initiation_endpoint_requires_auth(): void
    {
        $response = $this->postJson('/billing/paddle/checkout', [
            'plan_slug' => 'starter',
            'interval' => 'monthly',
        ]);

        $response->assertUnauthorized();
    }

    public function test_paddle_checkout_initiation_endpoint_returns_valid_params_for_owner(): void
    {
        $response = $this->actingAs($this->owner)->postJson('/billing/paddle/checkout', [
            'plan_slug' => 'starter',
            'interval' => 'monthly',
            'organization_id' => $this->organization->id,
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'success',
            'checkout' => [
                'environment' => 'sandbox',
                'client_token' => 'test_client_token_xyz',
                'price_id' => 'pri_starter_mo_123',
                'customer' => [
                    'email' => 'director@oakridge.edu',
                ],
                'custom_data' => [
                    'organization_id' => $this->organization->id,
                    'plan_slug' => 'starter',
                ],
            ],
        ]);
    }
}

