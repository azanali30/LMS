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

    public function test_requesting_otp_for_unregistered_email_returns_404(): void
    {
        $response = $this->postJson('/onboarding/status/request-otp', [
            'email' => 'unknown@nowhere.com',
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'found' => false,
        ]);
    }

    public function test_requesting_otp_generates_code_and_sends_email(): void
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
            return $mail->hasTo('director@academy.org') && strlen($mail->code) === 6;
        });

        $cached = Cache::get('tracking_otp_director@academy.org');
        $this->assertNotNull($cached);
        $this->assertSame(6, strlen($cached['code']));
    }

    public function test_verifying_with_invalid_otp_fails(): void
    {
        Cache::put('tracking_otp_applicant@school.com', [
            'code' => '654321',
            'attempts' => 0,
        ], now()->addMinutes(15));

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
        ], now()->addMinutes(15));

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
                'status' => 'under_review',
                'status_label' => 'Under Review / Pending Verification',
                'transaction_reference' => 'TX-PROOF-777',
            ],
        ]);

        // Session now has tracking_verified_email
        $this->assertEquals('valid@school.com', session('tracking_verified_email'));

        // Subsequent status request succeeds
        $statusRes = $this->getJson('/onboarding/status?email=valid@school.com');
        $statusRes->assertOk();
        $statusRes->assertJsonFragment(['transaction_reference' => 'TX-PROOF-777']);
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
            now()->addMinutes(15),
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
            'completion_token' => null, // NULL token from manual DB edit
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
        $this->assertSame('awaiting_institution_details', $data['status']);
        $this->assertSame('Approved — Awaiting Institution Setup', $data['status_label']);
        $this->assertStringContainsString('/onboarding/complete/'.$app->completion_token, $data['action_url']);
    }

    public function test_all_five_tracking_statuses_format_correctly(): void
    {
        // 1. Pending payment (draft)
        $draft = PaymentApprovalRequest::create([
            'email' => 'draft@school.com',
            'plan_slug' => 'growth',
            'current_step' => 3,
            'status' => PaymentApprovalRequest::STATUS_DRAFT,
        ]);
        $this->assertSame('pending_payment', $draft->trackingStatus());

        // 2. Under review (pending)
        $pending = PaymentApprovalRequest::create([
            'email' => 'pending@school.com',
            'plan_slug' => 'growth',
            'status' => PaymentApprovalRequest::STATUS_PENDING,
        ]);
        $this->assertSame('under_review', $pending->trackingStatus());

        // 3. Awaiting institution details (approved, completed_at null)
        $approved = PaymentApprovalRequest::create([
            'email' => 'approved2@school.com',
            'plan_slug' => 'growth',
            'status' => PaymentApprovalRequest::STATUS_APPROVED,
            'completed_at' => null,
        ]);
        $this->assertSame('awaiting_institution_details', $approved->trackingStatus());

        // 4. Completed (completed_at set)
        $completed = PaymentApprovalRequest::create([
            'email' => 'completed@school.com',
            'plan_slug' => 'growth',
            'status' => PaymentApprovalRequest::STATUS_APPROVED,
            'completed_at' => now(),
        ]);
        $this->assertSame('completed', $completed->trackingStatus());

        // 5. Rejected
        $rejected = PaymentApprovalRequest::create([
            'email' => 'rejected@school.com',
            'plan_slug' => 'growth',
            'status' => PaymentApprovalRequest::STATUS_REJECTED,
            'rejection_reason' => 'Invalid bank slip.',
        ]);
        $this->assertSame('rejected', $rejected->trackingStatus());
    }
}

