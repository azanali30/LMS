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
use Tests\TestCase;

class ManualPaymentOnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Mail::fake();

        // Seed core plans if not present
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

    public function test_visitor_can_access_onboarding_page(): void
    {
        $response = $this->get('/register');
        $response->assertOk();
    }

    public function test_email_availability_check(): void
    {
        // 1. Available email
        $res1 = $this->postJson('/onboarding/check-email', [
            'email' => 'new-director@example.com',
        ]);
        $res1->assertOk()->assertJson(['status' => 'available']);

        // 2. Existing registered user email
        User::create([
            'name' => 'Existing User',
            'email' => 'existing@example.com',
            'password' => Hash::make('password123'),
            'role' => 'student',
        ]);

        $res2 = $this->postJson('/onboarding/check-email', [
            'email' => 'existing@example.com',
        ]);
        $res2->assertStatus(422)->assertJson(['status' => 'registered']);
    }

    public function test_visitor_can_submit_payment_proof(): void
    {
        $file = UploadedFile::fake()->image('deposit-receipt.png', 800, 600);

        $response = $this->post('/onboarding/submit-payment', [
            'email' => 'academy-founder@example.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'SCB-TXN-20261031-01',
            'receipt' => $file,
            'notes' => 'Branch deposit slip attached',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'reference' => 'SCB-TXN-20261031-01',
                'email' => 'academy-founder@example.com',
            ]);

        $this->assertDatabaseHas('payment_approval_requests', [
            'email' => 'academy-founder@example.com',
            'plan_slug' => 'growth',
            'transaction_reference' => 'SCB-TXN-20261031-01',
            'status' => 'pending',
        ]);

        $approval = PaymentApprovalRequest::where('transaction_reference', 'SCB-TXN-20261031-01')->first();
        $this->assertNotNull($approval);
        Storage::disk('local')->assertExists($approval->receipt_path);

        // Submitting duplicate transaction reference must fail
        $file2 = UploadedFile::fake()->image('duplicate.png');
        $dupResponse = $this->postJson('/onboarding/submit-payment', [
            'email' => 'another-applicant@example.com',
            'plan_slug' => 'starter',
            'billing_interval' => 'monthly',
            'payment_method' => 'jazzcash',
            'transaction_reference' => 'SCB-TXN-20261031-01',
            'receipt' => $file2,
        ]);
        $dupResponse->assertStatus(422);
    }

    public function test_unauthorized_user_cannot_access_or_action_admin_approvals(): void
    {
        $normalUser = User::create([
            'name' => 'Regular Teacher',
            'email' => 'teacher@example.com',
            'password' => Hash::make('password123'),
            'role' => 'teacher',
        ]);

        $this->actingAs($normalUser)
            ->get('/admin/payment-approvals')
            ->assertForbidden();

        $this->actingAs($normalUser)
            ->post('/admin/payment-approvals/1/approve')
            ->assertForbidden();
    }

    public function test_platform_superadmin_can_view_download_receipt_and_approve_payment(): void
    {
        $admin = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@institutopropio.com',
            'password' => Hash::make('secretadmin123'),
            'role' => 'super_admin',
        ]);

        $file = UploadedFile::fake()->image('slip.png');
        $stored = Storage::disk('local')->putFile('payment_receipts', $file);

        $request = PaymentApprovalRequest::create([
            'email' => 'dr.jenkins@highschool.edu',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'HBL-992014',
            'receipt_path' => $stored,
            'receipt_original_name' => 'slip.png',
            'receipt_mime' => 'image/png',
            'status' => 'pending',
        ]);

        // 1. Admin views listing
        $this->actingAs($admin)
            ->get('/admin/payment-approvals')
            ->assertOk();

        // 2. Admin downloads/streams receipt
        $receiptRes = $this->actingAs($admin)
            ->get("/admin/payment-approvals/{$request->id}/receipt");
        $receiptRes->assertOk();

        // 3. Admin approves payment
        $approveRes = $this->actingAs($admin)
            ->post("/admin/payment-approvals/{$request->id}/approve");
        $approveRes->assertRedirect();

        $request->refresh();
        $this->assertEquals('approved', $request->status);
        $this->assertEquals($admin->id, $request->approved_by);
        $this->assertNotNull($request->approved_at);
        $this->assertNotNull($request->completion_token);
        $this->assertTrue($request->isTokenValid());

        // 4. Repeated approve attempt is idempotent / handled safely
        $dupApprove = $this->actingAs($admin)
            ->post("/admin/payment-approvals/{$request->id}/approve");
        $dupApprove->assertRedirect();
    }

    public function test_platform_superadmin_can_reject_payment_and_applicant_can_track_status(): void
    {
        $admin = User::create([
            'name' => 'Super Administrator',
            'email' => 'admin-reject@institutopropio.com',
            'password' => Hash::make('secretadmin123'),
            'role' => 'super_admin',
        ]);

        $request = PaymentApprovalRequest::create([
            'email' => 'invalid-proof@example.com',
            'plan_slug' => 'starter',
            'billing_interval' => 'monthly',
            'amount_cents' => 1900,
            'currency' => 'USD',
            'payment_method' => 'jazzcash',
            'transaction_reference' => 'FAKE-TID-001',
            'receipt_path' => 'dummy/path.png',
            'status' => 'pending',
        ]);

        // Rejection requires reason
        $this->actingAs($admin)
            ->post("/admin/payment-approvals/{$request->id}/reject", ['rejection_reason' => ''])
            ->assertSessionHasErrors('rejection_reason');

        // Successful rejection
        $this->actingAs($admin)
            ->post("/admin/payment-approvals/{$request->id}/reject", [
                'rejection_reason' => 'Transaction ID not matching any JazzCash merchant logs.',
            ])
            ->assertRedirect();

        $request->refresh();
        $this->assertEquals('rejected', $request->status);
        $this->assertEquals('Transaction ID not matching any JazzCash merchant logs.', $request->rejection_reason);
        $this->assertNull($request->completion_token);

        // Applicant checks status
        $statusRes = $this->getJson('/onboarding/status?email=invalid-proof@example.com');
        $statusRes->assertOk()
            ->assertJson([
                'found' => true,
                'status' => 'rejected',
                'rejection_reason' => 'Transaction ID not matching any JazzCash merchant logs.',
            ]);
    }

    public function test_approved_applicant_can_complete_account_and_institution_setup(): void
    {
        $approvedTime = Carbon::now()->subMinutes(10);

        $request = PaymentApprovalRequest::create([
            'email' => 'founder@premier-academy.edu',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'WIRE-OK-7721',
            'receipt_path' => 'payment_receipts/valid.png',
            'status' => 'approved',
            'approved_at' => $approvedTime,
            'completion_token' => 'secure-approval-token-1234567890abcdef',
            'token_expires_at' => Carbon::now()->addDays(7),
        ]);

        // 1. Access complete form with valid token
        $this->get("/onboarding/complete/{$request->completion_token}")
            ->assertOk();

        // 2. Submit completion details
        $res = $this->post("/onboarding/complete/{$request->completion_token}", [
            'name' => 'Prof. Christopher Walker',
            'school_name' => 'Premier Science Academy',
            'organization_type' => 'academy',
            'subdomain' => 'premier-science-academy',
            'password' => 'SecurePass#2026',
            'password_confirmation' => 'SecurePass#2026',
        ]);

        $res->assertOk();

        // 3. User created and email verified
        $user = User::where('email', 'founder@premier-academy.edu')->first();
        $this->assertNotNull($user);
        $this->assertEquals('Prof. Christopher Walker', $user->name);
        $this->assertNotNull($user->email_verified_at);

        // 4. Organization created with subdomain
        $org = Organization::where('slug', 'premier-science-academy')->first();
        $this->assertNotNull($org);
        $this->assertEquals('Premier Science Academy', $org->name);
        $this->assertEquals('active', $org->status);

        // 5. User is owner of the organization
        $this->assertTrue($user->organizations()->wherePivot('role', 'owner')->exists());

        // 6. OrganizationSubscription created with 30-Day Free Trial starting at approved timestamp
        $sub = OrganizationSubscription::where('organization_id', $org->id)->first();
        $this->assertNotNull($sub);
        $this->assertEquals(OrganizationSubscription::STATUS_TRIALING, $sub->status);
        $this->assertEquals('manual_payment', $sub->billing_type);
        $this->assertEquals('verified', $sub->payment_method_status);
        $this->assertEquals($approvedTime->toDateTimeString(), $sub->starts_at->toDateTimeString());
        $this->assertEquals($approvedTime->copy()->addDays(30)->toDateTimeString(), $sub->trial_ends_at->toDateTimeString());

        // 7. Request marked completed and single-use token invalidated
        $request->refresh();
        $this->assertNotNull($request->completed_at);
        $this->assertEquals($user->id, $request->created_user_id);
        $this->assertEquals($org->id, $request->created_organization_id);
        $this->assertEquals($sub->id, $request->created_subscription_id);
        $this->assertNull($request->completion_token);

        // 8. Re-attempting completion with same token fails (single-use enforced)
        $reAttempt = $this->post("/onboarding/complete/secure-approval-token-1234567890abcdef", [
            'name' => 'Hacker Try',
            'school_name' => 'Duplicate Academy',
            'organization_type' => 'school',
            'password' => 'SecurePass#2026',
            'password_confirmation' => 'SecurePass#2026',
        ]);
        $reAttempt->assertRedirect(route('register'));

        // 9. Newly registered user can log in normally with their credentials
        $loginRes = $this->post('/login', [
            'email' => 'founder@premier-academy.edu',
            'password' => 'SecurePass#2026',
        ]);
        $this->assertAuthenticatedAs($user);
    }

    public function test_user_cannot_complete_with_expired_token(): void
    {
        $request = PaymentApprovalRequest::create([
            'email' => 'expired@example.com',
            'plan_slug' => 'starter',
            'billing_interval' => 'monthly',
            'amount_cents' => 1900,
            'currency' => 'USD',
            'payment_method' => 'bank_transfer',
            'transaction_reference' => 'EXP-999',
            'receipt_path' => 'dummy.png',
            'status' => 'approved',
            'approved_at' => Carbon::now()->subDays(10),
            'completion_token' => 'expired-token-xyz',
            'token_expires_at' => Carbon::now()->subDays(3),
        ]);

        $this->get("/onboarding/complete/{$request->completion_token}")
            ->assertRedirect(route('register'));

        $this->post("/onboarding/complete/{$request->completion_token}", [
            'name' => 'Expired User',
            'school_name' => 'Expired Academy',
            'organization_type' => 'school',
            'password' => 'Password123#',
            'password_confirmation' => 'Password123#',
        ])->assertRedirect(route('register'));
    }

    public function test_user_can_resubmit_payment_proof_after_rejection(): void
    {
        PaymentApprovalRequest::create([
            'email' => 'resubmit-applicant@example.com',
            'plan_slug' => 'starter',
            'billing_interval' => 'monthly',
            'amount_cents' => 1900,
            'currency' => 'USD',
            'payment_method' => 'easypaisa',
            'transaction_reference' => 'REJECTED-TRX-01',
            'receipt_path' => 'old_slip.png',
            'status' => 'rejected',
            'rejection_reason' => 'Illegible screenshot',
        ]);

        // Email check informs of previous rejection
        $check = $this->postJson('/onboarding/check-email', [
            'email' => 'resubmit-applicant@example.com',
        ]);
        $check->assertOk()->assertJson([
            'status' => 'previously_rejected',
            'rejection_reason' => 'Illegible screenshot',
        ]);

        // Resubmit with new transaction reference and clear receipt
        $file = UploadedFile::fake()->image('clear-receipt.png');
        $resubmit = $this->post('/onboarding/submit-payment', [
            'email' => 'resubmit-applicant@example.com',
            'plan_slug' => 'starter',
            'billing_interval' => 'monthly',
            'payment_method' => 'easypaisa',
            'transaction_reference' => 'NEW-VALID-TRX-02',
            'receipt' => $file,
            'notes' => 'Re-uploaded clearer receipt',
        ]);

        $resubmit->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseHas('payment_approval_requests', [
            'email' => 'resubmit-applicant@example.com',
            'transaction_reference' => 'NEW-VALID-TRX-02',
            'status' => 'pending',
        ]);
    }

    public function test_existing_users_can_still_login_normally(): void
    {
        $existing = User::create([
            'name' => 'Legacy Teacher',
            'email' => 'legacy.teacher@school.edu',
            'password' => Hash::make('LegacyPassword#2026'),
            'role' => 'teacher',
        ]);

        $response = $this->post('/login', [
            'email' => 'legacy.teacher@school.edu',
            'password' => 'LegacyPassword#2026',
        ]);

        $this->assertAuthenticatedAs($existing);
    }
}
