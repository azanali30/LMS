<?php

namespace Tests\Feature;

use App\Mail\TrackingVerificationCodeMail;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\PaymentApprovalRequest;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class OnboardingTrackingSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        SubscriptionPlan::create([
            'name' => 'Growth',
            'slug' => 'growth',
            'monthly_price_cents' => 4900,
            'yearly_price_cents' => 49000,
            'currency' => 'USD',
            'features' => ['unlimited_students'],
            'is_active' => true,
        ]);
    }

    public function test_cannot_access_private_application_details_by_email_alone_without_otp(): void
    {
        $app = PaymentApprovalRequest::create([
            'email' => 'victim@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'status' => PaymentApprovalRequest::STATUS_PENDING,
            'transaction_reference' => 'SECRET-TX-999',
        ]);

        // Attempting to query via JSON without OTP session
        $response = $this->getJson('/onboarding/status?email=victim@school.com');
        $response->assertStatus(403);
        $response->assertJson([
            'verified' => false,
        ]);
        $response->assertJsonMissing(['SECRET-TX-999']);

        // Attempting to visit page HTML without verification
        $htmlResponse = $this->get('/onboarding/status?email=victim@school.com');
        $htmlResponse->assertOk();
        $htmlResponse->assertInertia(fn ($page) => $page
            ->component('auth/onboarding-status')
            ->where('verified', false)
            ->where('approvalRequest', null)
            ->where('searchEmail', 'victim@school.com')
        );
    }

    public function test_requesting_otp_does_not_reveal_application_existence_user_enumeration(): void
    {
        Mail::fake();

        // 1. Unregistered email receives generic success without sending mail
        $response = $this->postJson('/onboarding/status/request-otp', [
            'email' => 'nonexistent@nowhere.com',
        ]);

        $response->assertOk();
        $response->assertJson([
            'sent' => true,
            'email' => 'nonexistent@nowhere.com',
        ]);

        Mail::assertNothingSent();
        $this->assertNull(Cache::get('tracking_otp_nonexistent@nowhere.com'));
    }

    public function test_requesting_otp_generates_code_and_sends_email_for_registered_application(): void
    {
        Mail::fake();

        PaymentApprovalRequest::create([
            'email' => 'director@academy.org',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'status' => PaymentApprovalRequest::STATUS_PENDING,
            'transaction_reference' => 'TX-12345',
        ]);

        $response = $this->postJson('/onboarding/status/request-otp', [
            'email' => 'director@academy.org',
        ]);

        $response->assertOk();
        $response->assertJson([
            'sent' => true,
            'email' => 'director@academy.org',
        ]);

        Mail::assertSent(TrackingVerificationCodeMail::class, function ($mail) {
            return $mail->hasTo('director@academy.org')
                && strlen($mail->code) === 6
                && $mail->expiresInMinutes === 10;
        });

        $cached = Cache::get('tracking_otp_director@academy.org');
        $this->assertNotNull($cached);
        $this->assertSame(6, strlen($cached['code']));
    }

    public function test_otp_expires_after_ten_minutes(): void
    {
        Cache::put('tracking_otp_timed@school.com', [
            'code' => '123456',
            'attempts' => 0,
        ], now()->addMinutes(10));

        // Travel 11 minutes into the future
        $this->travel(11)->minutes();

        $response = $this->postJson('/onboarding/status/verify-otp', [
            'email' => 'timed@school.com',
            'code' => '123456',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'The verification code has expired (valid for 10 minutes) or was not requested. Please request a new code.',
        ]);
    }

    public function test_verifying_with_invalid_otp_fails(): void
    {
        Cache::put('tracking_otp_applicant@school.com', [
            'code' => '654321',
            'attempts' => 0,
        ], now()->addMinutes(10));

        $response = $this->postJson('/onboarding/status/verify-otp', [
            'email' => 'applicant@school.com',
            'code' => '111111',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => 'Invalid verification code. Please check your email and try again (4 attempts remaining).',
        ]);
    }

    public function test_verifying_with_valid_otp_unlocks_status_and_persists_session(): void
    {
        $app = PaymentApprovalRequest::create([
            'email' => 'valid@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'status' => PaymentApprovalRequest::STATUS_PENDING,
            'transaction_reference' => 'TX-PROOF-777',
        ]);

        Cache::put('tracking_otp_valid@school.com', [
            'code' => '888999',
            'attempts' => 0,
        ], now()->addMinutes(10));

        $response = $this->postJson('/onboarding/status/verify-otp', [
            'email' => 'valid@school.com',
            'code' => '888999',
        ]);

        $response->assertOk();
        $response->assertJson([
            'verified' => true,
            'found' => true,
            'application' => [
                'email' => 'valid@school.com',
                'status' => 'pending_review',
                'status_label' => 'Payment Pending Review',
                'transaction_reference' => 'TX-PROOF-777',
            ],
        ]);

        // Session now has tracking_verified_email
        $this->assertEquals('valid@school.com', session('tracking_verified_email'));

        // Refreshing page without ?email= in URL retains verified application!
        $statusRes = $this->get('/onboarding/status');
        $statusRes->assertOk();
        $statusRes->assertInertia(fn ($page) => $page
            ->component('auth/onboarding-status')
            ->where('verified', true)
            ->where('approvalRequest.email', 'valid@school.com')
            ->where('approvalRequest.transaction_reference', 'TX-PROOF-777')
        );
    }

    public function test_reset_session_endpoint_clears_verification(): void
    {
        $this->withSession(['tracking_verified_email' => 'verified@school.com']);

        $resetRes = $this->postJson('/onboarding/status/reset');
        $resetRes->assertOk();
        $this->assertNull(session('tracking_verified_email'));

        $checkRes = $this->get('/onboarding/status');
        $checkRes->assertInertia(fn ($page) => $page
            ->component('auth/onboarding-status')
            ->where('verified', false)
            ->where('approvalRequest', null)
        );
    }

    public function test_signed_magic_link_authorizes_session_and_redirects(): void
    {
        PaymentApprovalRequest::create([
            'email' => 'magic@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'status' => PaymentApprovalRequest::STATUS_PENDING,
            'transaction_reference' => 'TX-MAGIC-100',
        ]);

        $signedUrl = URL::temporarySignedRoute(
            'onboarding.status.verify-link',
            now()->addMinutes(10),
            ['email' => 'magic@school.com']
        );

        $response = $this->get($signedUrl);
        $response->assertRedirect('/onboarding/status?email=magic%40school.com');
        $this->assertEquals('magic@school.com', session('tracking_verified_email'));
    }

    public function test_approved_request_with_missing_token_automatically_receives_valid_token_and_completion_button(): void
    {
        // Simulate manual database approval without completion_token (e.g. HeidiSQL update)
        $app = PaymentApprovalRequest::create([
            'email' => 'approved@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'status' => PaymentApprovalRequest::STATUS_APPROVED,
            'transaction_reference' => 'TX-APPROVED-111',
            'completion_token' => null,
            'token_expires_at' => null,
            'completed_at' => null,
        ]);

        $this->withSession(['tracking_verified_email' => 'approved@school.com']);

        $response = $this->getJson('/onboarding/status?email=approved@school.com');
        $response->assertOk();

        $app->refresh();
        $this->assertNotEmpty($app->completion_token, 'A valid completion token was generated automatically.');
        $this->assertTrue($app->isTokenValid());

        $data = $response->json('application');
        $this->assertSame('approved', $data['status']);
        $this->assertSame('Approved', $data['status_label']);
        $this->assertStringContainsString('/onboarding/complete/'.$app->completion_token, $data['action_url']);
    }

    public function test_all_four_application_statuses_format_accurately_with_details(): void
    {
        // 1. Payment Pending Review
        $pending = PaymentApprovalRequest::create([
            'email' => 'pending@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'transaction_reference' => 'TX-PENDING-001',
            'status' => PaymentApprovalRequest::STATUS_PENDING,
        ]);
        $this->withSession(['tracking_verified_email' => 'pending@school.com']);
        $res1 = $this->getJson('/onboarding/status');
        $res1->assertOk();
        $this->assertSame('Payment Pending Review', $res1->json('application.status_label'));
        $this->assertSame('TX-PENDING-001', $res1->json('application.transaction_reference'));

        // 2. Approved
        $approved = PaymentApprovalRequest::create([
            'email' => 'approved2@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'transaction_reference' => 'TX-APPROVED-002',
            'status' => PaymentApprovalRequest::STATUS_APPROVED,
            'completed_at' => null,
        ]);
        $this->withSession(['tracking_verified_email' => 'approved2@school.com']);
        $res2 = $this->getJson('/onboarding/status');
        $res2->assertOk();
        $this->assertSame('Approved', $res2->json('application.status_label'));
        $this->assertNotNull($res2->json('application.action_url'));

        // 3. Rejected
        $rejected = PaymentApprovalRequest::create([
            'email' => 'rejected@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'transaction_reference' => 'TX-REJECTED-003',
            'status' => PaymentApprovalRequest::STATUS_REJECTED,
            'rejection_reason' => 'Invalid bank slip receipt image.',
        ]);
        $this->withSession(['tracking_verified_email' => 'rejected@school.com']);
        $res3 = $this->getJson('/onboarding/status');
        $res3->assertOk();
        $this->assertSame('Rejected', $res3->json('application.status_label'));
        $this->assertSame('Invalid bank slip receipt image.', $res3->json('application.admin_feedback'));

        // 4. Additional Information Required
        $addInfo = PaymentApprovalRequest::create([
            'email' => 'addinfo@school.com',
            'plan_slug' => 'growth',
            'billing_interval' => 'monthly',
            'amount_cents' => 4900,
            'currency' => 'USD',
            'transaction_reference' => 'TX-ADDINFO-004',
            'status' => PaymentApprovalRequest::STATUS_ADDITIONAL_INFO,
            'rejection_reason' => 'Please provide a clearer photo of the bank transfer stamped voucher.',
        ]);
        $this->withSession(['tracking_verified_email' => 'addinfo@school.com']);
        $res4 = $this->getJson('/onboarding/status');
        $res4->assertOk();
        $this->assertSame('Additional Information Required', $res4->json('application.status_label'));
        $this->assertSame('Please provide a clearer photo of the bank transfer stamped voucher.', $res4->json('application.admin_feedback'));
    }
}
