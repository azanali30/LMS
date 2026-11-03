<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\PaymentApprovalRequest;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OnboardingWorkflowPersistenceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Mail::fake();

        SubscriptionPlan::firstOrCreate(['slug' => 'starter'], [
            'name' => 'Starter',
            'monthly_price' => 19,
            'price_cents' => 1900,
            'price_annual_cents' => 19000,
            'currency' => 'USD',
            'billing_interval' => 'monthly',
            'max_organizations' => 1,
            'is_active' => true,
        ]);

        SubscriptionPlan::firstOrCreate(['slug' => 'growth'], [
            'name' => 'Growth',
            'monthly_price' => 49,
            'price_cents' => 4900,
            'price_annual_cents' => 49000,
            'currency' => 'USD',
            'billing_interval' => 'monthly',
            'max_organizations' => 5,
            'is_active' => true,
        ]);

        SubscriptionPlan::firstOrCreate(['slug' => 'professional'], [
            'name' => 'Professional',
            'monthly_price' => 99,
            'price_cents' => 9900,
            'price_annual_cents' => 99000,
            'currency' => 'USD',
            'billing_interval' => 'monthly',
            'max_organizations' => 10,
            'is_active' => true,
        ]);
    }

    public function test_new_email_starts_registration_and_progress_is_restored_on_refresh(): void
    {
        // 1. Visitor submits Step 1 email
        $res = $this->postJson('/onboarding/check-email', [
            'email' => 'dean@oxford-prep.edu',
        ]);

        $res->assertOk()
            ->assertJson([
                'status' => 'available',
                'step' => 2,
                'email' => 'dean@oxford-prep.edu',
            ]);

        $token = $res->json('registration_token');
        $this->assertNotEmpty($token);

        // 2. Browser refresh on /register must retain Step 2 and the submitted email
        $this->withSession(['onboarding_token' => $token])
            ->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register-onboarding')
                ->where('initialStep', 2)
                ->where('initialEmail', 'dean@oxford-prep.edu')
            );
    }

    public function test_existing_registered_email_is_rejected_with_clear_message(): void
    {
        User::create([
            'name' => 'Existing Principal',
            'email' => 'principal@school.edu',
            'password' => Hash::make('secretpass'),
            'role' => 'student',
        ]);

        $res = $this->postJson('/onboarding/check-email', [
            'email' => '  PRINCIPAL@school.edu  ', // Test normalization
        ]);

        $res->assertStatus(422)
            ->assertJson([
                'status' => 'registered',
            ])
            ->assertJsonFragment([
                'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
            ]);
    }

    public function test_existing_pending_email_is_rejected_with_tracking_guidance(): void
    {
        PaymentApprovalRequest::create([
            'email' => 'pending-director@school.edu',
            'pending_email' => 'pending-director@school.edu',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'TXN-PENDING-001',
            'receipt_path' => 'receipts/test.png',
            'status' => 'pending',
        ]);

        $res = $this->postJson('/onboarding/check-email', [
            'email' => 'pending-director@school.edu',
        ]);

        $res->assertStatus(422)
            ->assertJson([
                'status' => 'pending_approval',
            ])
            ->assertJsonFragment([
                'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
            ]);
    }

    public function test_select_starter_plan_and_refresh_preserves_selection(): void
    {
        $res = $this->postJson('/onboarding/check-email', [
            'email' => 'starter-user@school.edu',
        ]);
        $token = $res->json('registration_token');

        // Select Starter Plan and annual billing
        $save = $this->withSession(['onboarding_token' => $token])
            ->postJson('/onboarding/save-progress', [
                'step' => 3,
                'plan_slug' => 'starter',
                'billing_interval' => 'annual',
            ]);
        $save->assertOk()->assertJson(['step' => 3]);

        // Refresh on /register must retain Step 3, starter plan, and annual interval
        $this->withSession(['onboarding_token' => $token])
            ->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register-onboarding')
                ->where('initialStep', 3)
                ->where('initialPlan', 'starter')
                ->where('initialInterval', 'annual')
            );
    }

    public function test_select_growth_plan_and_refresh_preserves_selection(): void
    {
        $res = $this->postJson('/onboarding/check-email', [
            'email' => 'growth-user@school.edu',
        ]);
        $token = $res->json('registration_token');

        // Select Growth Plan
        $save = $this->withSession(['onboarding_token' => $token])
            ->postJson('/onboarding/save-progress', [
                'step' => 3,
                'plan_slug' => 'growth',
                'billing_interval' => 'monthly',
            ]);
        $save->assertOk()->assertJson(['step' => 3]);

        // Refresh
        $this->withSession(['onboarding_token' => $token])
            ->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register-onboarding')
                ->where('initialStep', 3)
                ->where('initialPlan', 'growth')
                ->where('initialInterval', 'monthly')
            );
    }

    public function test_select_professional_plan_and_refresh_preserves_selection(): void
    {
        $res = $this->postJson('/onboarding/check-email', [
            'email' => 'pro-user@school.edu',
        ]);
        $token = $res->json('registration_token');

        // Select Professional Plan
        $save = $this->withSession(['onboarding_token' => $token])
            ->postJson('/onboarding/save-progress', [
                'step' => 4,
                'plan_slug' => 'professional',
                'billing_interval' => 'annual',
                'payment_method' => 'bank_transfer',
            ]);
        $save->assertOk()->assertJson(['step' => 4]);

        // Refresh on /register must be on Step 4
        $this->withSession(['onboarding_token' => $token])
            ->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register-onboarding')
                ->where('initialStep', 4)
                ->where('initialPlan', 'professional')
                ->where('initialInterval', 'annual')
            );
    }

    public function test_backward_and_forward_navigation_preserves_state(): void
    {
        $res = $this->postJson('/onboarding/check-email', [
            'email' => 'nav-user@school.edu',
        ]);
        $token = $res->json('registration_token');

        // Progress to Step 3
        $this->withSession(['onboarding_token' => $token])
            ->postJson('/onboarding/save-progress', [
                'step' => 3,
                'plan_slug' => 'growth',
            ]);

        // Navigate back to Step 2
        $this->withSession(['onboarding_token' => $token])
            ->postJson('/onboarding/save-progress', [
                'step' => 2,
            ]);

        // Refresh should reflect Step 2
        $this->withSession(['onboarding_token' => $token])
            ->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register-onboarding')
                ->where('initialStep', 2)
            );
    }

    public function test_submit_payment_proof_and_refresh_retains_confirmation_screen(): void
    {
        $file = UploadedFile::fake()->image('wire-slip.png', 600, 400);

        // Submit payment proof
        $res = $this->post('/onboarding/submit-payment', [
            'email' => 'founder@academytrails.com',
            'plan_slug' => 'professional',
            'billing_interval' => 'annual',
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'WIRE-992384-CONF',
            'receipt' => $file,
            'notes' => 'Annual payment sent via swift',
        ]);

        $res->assertOk()
            ->assertJson([
                'success' => true,
                'reference' => 'WIRE-992384-CONF',
                'email' => 'founder@academytrails.com',
            ]);

        // Refreshing on /register after submission must render confirmation screen (Step 5)
        $this->get('/register')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/register-onboarding')
                ->where('initialStep', 5)
                ->has('submissionResult')
            );
    }

    public function test_database_unique_pending_constraint_prevents_duplicate_applications(): void
    {
        $file1 = UploadedFile::fake()->image('receipt1.png');
        $file2 = UploadedFile::fake()->image('receipt2.png');

        // 1. First submission succeeds
        $res1 = $this->post('/onboarding/submit-payment', [
            'email' => 'single-pending@school.edu',
            'plan_slug' => 'starter',
            'billing_interval' => 'monthly',
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'TXN-UNIQUE-001',
            'receipt' => $file1,
        ]);
        $res1->assertOk();

        // 2. Second submission with same email must fail with duplicate message
        $res2 = $this->postJson('/onboarding/submit-payment', [
            'email' => 'single-pending@school.edu',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'payment_method' => 'jazzcash',
            'transaction_reference' => 'TXN-UNIQUE-002',
            'receipt' => $file2,
        ]);

        $res2->assertStatus(422)
            ->assertJson([
                'status' => 'pending_approval',
            ])
            ->assertJsonFragment([
                'message' => 'This email address is already registered or has a pending application. Please sign in or track your existing application.',
            ]);

        // Database must have only 1 pending record for this email
        $this->assertEquals(
            1,
            PaymentApprovalRequest::where('email', 'single-pending@school.edu')
                ->where('status', 'pending')
                ->count()
        );
    }
}
