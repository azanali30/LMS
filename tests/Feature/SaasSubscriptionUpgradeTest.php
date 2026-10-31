<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Notifications\TrialExpiringNotification;
use App\Services\Billing\SubscriptionService;
use Carbon\Carbon;
use Database\Seeders\PlatformSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SaasSubscriptionUpgradeTest extends TestCase
{
    use RefreshDatabase;

    protected SubscriptionService $subscriptionService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PlatformSeeder::class);
        $this->seed(SubscriptionPlanSeeder::class);

        $this->subscriptionService = app(SubscriptionService::class);
    }

    /**
     * 1. Test exact pricing values in cents for Starter, Growth, Professional, and Enterprise.
     */
    public function test_plans_have_exact_pricing_in_cents_and_expected_institution_limits(): void
    {
        // Starter: $19/mo (1,900¢), $190/yr (19,000¢) — 1 institution
        $starter = SubscriptionPlan::where('slug', 'starter')->firstOrFail();
        $this->assertSame(1900, $starter->price_cents);
        $this->assertSame(19000, $starter->price_annual_cents);
        $this->assertSame(1, $starter->max_organizations);
        $this->assertSame(0, $starter->max_students); // unlimited
        $this->assertSame(0, $starter->max_teachers); // unlimited
        $this->assertSame('$19', $starter->formattedPrice('month'));
        $this->assertSame('$190', $starter->formattedPrice('year'));

        // Growth: $49/mo (4,900¢), $490/yr (49,000¢) — Up to 5 institutions
        $growth = SubscriptionPlan::where('slug', 'growth')->firstOrFail();
        $this->assertSame(4900, $growth->price_cents);
        $this->assertSame(49000, $growth->price_annual_cents);
        $this->assertSame(5, $growth->max_organizations);
        $this->assertSame(0, $growth->max_students); // unlimited
        $this->assertSame(0, $growth->max_teachers); // unlimited
        $this->assertSame('$49', $growth->formattedPrice('month'));
        $this->assertSame('$490', $growth->formattedPrice('year'));

        // Professional: $99/mo (9,900¢), $990/yr (99,000¢) — Up to 10 institutions
        $pro = SubscriptionPlan::where('slug', 'professional')->firstOrFail();
        $this->assertSame(9900, $pro->price_cents);
        $this->assertSame(99000, $pro->price_annual_cents);
        $this->assertSame(10, $pro->max_organizations);
        $this->assertSame(0, $pro->max_students); // unlimited
        $this->assertSame(0, $pro->max_teachers); // unlimited
        $this->assertSame('$99', $pro->formattedPrice('month'));
        $this->assertSame('$990', $pro->formattedPrice('year'));

        // Enterprise: Custom pricing ($0 in db), Unlimited institutions (null)
        $enterprise = SubscriptionPlan::where('slug', 'enterprise')->firstOrFail();
        $this->assertSame(0, $enterprise->price_cents);
        $this->assertNull($enterprise->max_organizations);
        $this->assertSame(0, $enterprise->max_students); // unlimited
        $this->assertSame(0, $enterprise->max_teachers); // unlimited
        $this->assertSame('Custom', $enterprise->formattedPrice('month'));
    }

    /**
     * 2. Test Annual billing provides ~16.67% discount (2 months free: annual price = 10x monthly).
     */
    public function test_annual_pricing_discount_calculation(): void
    {
        $starter = SubscriptionPlan::where('slug', 'starter')->firstOrFail();
        $this->assertSame($starter->price_cents * 10, $starter->price_annual_cents);

        $growth = SubscriptionPlan::where('slug', 'growth')->firstOrFail();
        $this->assertSame($growth->price_cents * 10, $growth->price_annual_cents);

        $pro = SubscriptionPlan::where('slug', 'professional')->firstOrFail();
        $this->assertSame($pro->price_cents * 10, $pro->price_annual_cents);

        // Verification of priceForInterval helper
        $this->assertSame(1900, $starter->priceForInterval('month'));
        $this->assertSame(19000, $starter->priceForInterval('year'));
    }

    /**
     * 3. Test legacy plan slug resolution alias mapping.
     */
    public function test_legacy_slug_alias_resolution(): void
    {
        $this->assertSame('starter', SubscriptionPlan::resolveSlugAlias('bronze'));
        $this->assertSame('growth', SubscriptionPlan::resolveSlugAlias('silver'));
        $this->assertSame('professional', SubscriptionPlan::resolveSlugAlias('gold'));
        $this->assertSame('enterprise', SubscriptionPlan::resolveSlugAlias('premium'));

        // Official slug remains unchanged
        $this->assertSame('growth', SubscriptionPlan::resolveSlugAlias('growth'));

        // findBySlug resolves alias seamlessly
        $resolvedStarter = SubscriptionPlan::findBySlug('bronze');
        $this->assertNotNull($resolvedStarter);
        $this->assertContains($resolvedStarter->slug, ['starter', 'bronze']);
    }

    /**
     * 4. Test multi-factor duplicate trial prevention.
     */
    public function test_multi_factor_trial_eligibility(): void
    {
        $user = User::factory()->create(['email' => 'founder@academynetwork.org']);
        $org = Organization::create([
            'name' => 'First Academy',
            'slug' => 'firstacademy',
            'created_by' => $user->id,
            'status' => 'active',
            'is_active' => true,
        ]);

        // First time is eligible
        $this->assertTrue($this->subscriptionService->isEligibleForTrial($user, 'firstacademy'));

        // Create an active trial subscription for this org
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();
        OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $user->id,
            'status' => OrganizationSubscription::STATUS_TRIALING,
            'billing_interval' => 'month',
            'currency' => 'USD',
            'trial_ends_at' => now()->addDays(30),
        ]);

        // Same user attempting another trial organization is disqualified
        $this->assertFalse($this->subscriptionService->isEligibleForTrial($user, 'secondacademy'));

        // Different user with existing subdomain is disqualified
        $anotherUser = User::factory()->create(['email' => 'other@academynetwork.org']);
        $this->assertFalse($this->subscriptionService->isEligibleForTrial($anotherUser, 'firstacademy'));
    }

    /**
     * 5. Test initial subscription in production enters pending_payment_method status without free trial active.
     */
    public function test_production_environment_requires_verified_payment_method_before_trial_activates(): void
    {
        Config::set('app.env', 'production');
        Config::set('billing.allow_dev_trial_bypass', false);

        $user = User::factory()->create(['email' => 'rector@college.edu']);
        $org = Organization::create([
            'name' => 'Grand College',
            'slug' => 'grandcollege',
            'created_by' => $user->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $growthPlan = SubscriptionPlan::where('slug', 'growth')->firstOrFail();

        $sub = $this->subscriptionService->createInitialSubscription($org, $user, $growthPlan, 'month');

        $this->assertSame(OrganizationSubscription::STATUS_PENDING_PAYMENT_METHOD, $sub->status);
        $this->assertSame('unverified', $sub->payment_method_status);
        $this->assertNull($sub->trial_ends_at);
        $this->assertTrue($sub->isPendingPaymentMethod());

        // Audit history was recorded
        $this->assertDatabaseHas('subscription_histories', [
            'organization_id' => $org->id,
            'subscription_id' => $sub->id,
            'event' => 'created',
            'to_status' => OrganizationSubscription::STATUS_PENDING_PAYMENT_METHOD,
        ]);
    }

    /**
     * 6. Test dev trial bypass is strictly prohibited in production.
     */
    public function test_dev_trial_bypass_throws_exception_in_production(): void
    {
        Config::set('app.env', 'production');
        Config::set('billing.allow_dev_trial_bypass', false);

        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Prod Test School',
            'slug' => 'prodtest',
            'created_by' => $user->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $user->id,
            'status' => OrganizationSubscription::STATUS_PENDING_PAYMENT_METHOD,
            'billing_interval' => 'month',
            'currency' => 'USD',
            'payment_method_status' => 'pending',
        ]);

        $this->expectException(\LogicException::class);
        $this->subscriptionService->activateDevTrialBypass($sub);
    }

    /**
     * 7. Test dev trial bypass works in local development environment.
     */
    public function test_dev_trial_bypass_activates_30_day_trial_in_local_environment(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 10:00:00'));
        Config::set('app.env', 'local');
        Config::set('billing.allow_dev_trial_bypass', true);

        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Dev Test School',
            'slug' => 'devtest',
            'created_by' => $user->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $user->id,
            'status' => OrganizationSubscription::STATUS_PENDING_PAYMENT_METHOD,
            'billing_interval' => 'month',
            'currency' => 'USD',
            'payment_method_status' => 'pending',
        ]);

        $activated = $this->subscriptionService->activateDevTrialBypass($sub);

        $this->assertSame(OrganizationSubscription::STATUS_TRIALING, $activated->status);
        $this->assertSame('verified', $activated->payment_method_status);
        $this->assertTrue($activated->trial_ends_at->isSameDay(Carbon::parse('2026-12-01 10:00:00')));
        $this->assertTrue($activated->isTrialing());

        // Audit history
        $this->assertDatabaseHas('subscription_histories', [
            'subscription_id' => $sub->id,
            'event' => 'trial_activated',
            'to_status' => OrganizationSubscription::STATUS_TRIALING,
        ]);
    }

    /**
     * 8. Test activating trial after verified payment method.
     */
    public function test_activate_trial_after_payment_verification(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 12:00:00'));

        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Verified School',
            'slug' => 'verifiedschool',
            'created_by' => $user->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $proPlan = SubscriptionPlan::where('slug', 'professional')->firstOrFail();
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $proPlan->id,
            'user_id' => $user->id,
            'status' => OrganizationSubscription::STATUS_PENDING_PAYMENT_METHOD,
            'billing_interval' => 'year',
            'currency' => 'USD',
            'payment_method_status' => 'pending',
        ]);

        $verified = $this->subscriptionService->activateTrialAfterPaymentVerification(
            $sub,
            'pm_card_test_123',
            'cust_test_123',
            'sub_test_456',
            ['brand' => 'visa', 'last4' => '4242']
        );

        $this->assertSame(OrganizationSubscription::STATUS_TRIALING, $verified->status);
        $this->assertSame('verified', $verified->payment_method_status);
        $this->assertSame('cust_test_123', $verified->gateway_customer_id);
        $this->assertSame('sub_test_456', $verified->gateway_subscription_id);
        $this->assertTrue($verified->trial_ends_at->isSameDay(Carbon::parse('2026-12-01 12:00:00')));

        // Audit history recorded
        $this->assertDatabaseHas('subscription_histories', [
            'subscription_id' => $sub->id,
            'event' => 'trial_activated',
            'to_status' => OrganizationSubscription::STATUS_TRIALING,
        ]);
    }

    /**
     * 9. Test plan change records audit history and updates plan and interval.
     */
    public function test_change_plan_updates_interval_and_records_history(): void
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Scaling Academy',
            'slug' => 'scalingacademy',
            'created_by' => $user->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();
        $growthPlan = SubscriptionPlan::where('slug', 'growth')->firstOrFail();

        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $user->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'billing_interval' => 'month',
            'currency' => 'USD',
            'ends_at' => now()->addMonth(),
        ]);

        $updated = $this->subscriptionService->changePlan($sub, $growthPlan, 'year', $user, 'Scaling campus branches');

        $this->assertSame($growthPlan->id, $updated->plan_id);
        $this->assertSame('annual', $updated->billing_interval);

        $this->assertDatabaseHas('subscription_histories', [
            'subscription_id' => $sub->id,
            'from_plan_id' => $starterPlan->id,
            'to_plan_id' => $growthPlan->id,
            'event' => 'plan_changed',
        ]);
    }

    /**
     * 10. Test cancellation sets cancelled_at and records history.
     */
    public function test_cancel_subscription_sets_timestamp_and_records_audit(): void
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Closing Academy',
            'slug' => 'closingacademy',
            'created_by' => $user->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();

        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $user->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'billing_interval' => 'month',
            'currency' => 'USD',
        ]);

        $cancelled = $this->subscriptionService->cancelSubscription($sub, 'School closing for summer', $user);

        $this->assertSame(OrganizationSubscription::STATUS_CANCELLED, $cancelled->status);
        $this->assertNotNull($cancelled->cancelled_at);

        $this->assertDatabaseHas('subscription_histories', [
            'subscription_id' => $sub->id,
            'event' => 'cancelled',
            'to_status' => OrganizationSubscription::STATUS_CANCELLED,
        ]);
    }

    /**
     * 11. Test owner-only billing access control: school owner succeeds, teacher is forbidden (403).
     */
    public function test_billing_management_is_strictly_gated_to_school_owners(): void
    {
        $owner = User::factory()->create(['role' => 'school_admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);

        $org = Organization::create([
            'name' => 'Perm School',
            'slug' => 'permschool',
            'created_by' => $owner->id,
            'status' => 'active',
            'is_active' => true,
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
            'is_active' => true,
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $teacher->id,
            'role' => 'teacher',
            'status' => 'active',
            'is_active' => true,
        ]);

        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();
        $growthPlan = SubscriptionPlan::where('slug', 'growth')->firstOrFail();

        OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $owner->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'billing_interval' => 'monthly',
            'currency' => 'USD',
        ]);

        // Teacher attempting to change plan receives 403
        $this->actingAs($teacher)
            ->post("/organizations/billing/plan?organization_id={$org->id}", [
                'organization_id' => $org->id,
                'plan_slug' => 'growth',
                'billing_interval' => 'monthly',
            ])
            ->assertForbidden();

        // Owner attempting to change plan succeeds (redirects back with success flash)
        $this->actingAs($owner)
            ->post("/organizations/billing/plan?organization_id={$org->id}", [
                'organization_id' => $org->id,
                'plan_slug' => 'growth',
                'billing_interval' => 'annual',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('organization_subscriptions', [
            'organization_id' => $org->id,
            'plan_id' => $growthPlan->id,
            'billing_interval' => 'annual',
        ]);
    }

    /**
     * 12. Test trial reminder scheduler alerts at 7, 3, 1, 0 days and updates last_reminded_at idempotently.
     */
    public function test_trial_reminder_command_dispatches_notifications_idempotently(): void
    {
        Notification::fake();
        Carbon::setTestNow(Carbon::parse('2026-11-01 09:00:00'));

        $owner = User::factory()->create(['email' => 'headmaster@school.org']);
        $org = Organization::create([
            'name' => 'Expiring School',
            'slug' => 'expiringschool',
            'created_by' => $owner->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();

        // 3 days remaining
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $owner->id,
            'status' => OrganizationSubscription::STATUS_TRIALING,
            'billing_interval' => 'monthly',
            'currency' => 'USD',
            'trial_ends_at' => Carbon::now()->addDays(3),
            'last_reminded_at' => null,
        ]);

        Artisan::call('subscriptions:check-trials');

        Notification::assertSentTo($owner, TrialExpiringNotification::class);

        $sub->refresh();
        $this->assertNotNull($sub->last_reminded_at);

        // Running command again immediately should be idempotent (not sending duplicate reminder on same day)
        Notification::fake();
        Artisan::call('subscriptions:check-trials');
        Notification::assertNothingSent();
    }

    /**
     * 13. Test trial expiration transitions to expired status without destroying school data.
     */
    public function test_trial_expiration_preserves_school_records_safely(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 10:00:00'));

        $owner = User::factory()->create();
        $org = Organization::create([
            'name' => 'Archive School',
            'slug' => 'archiveschool',
            'created_by' => $owner->id,
            'status' => 'active',
            'is_active' => true,
        ]);
        $starterPlan = SubscriptionPlan::where('slug', 'starter')->firstOrFail();

        // Create sample school records (student, class)
        $studentUser = User::factory()->create();
        StudentProfile::create([
            'organization_id' => $org->id,
            'user_id' => $studentUser->id,
            'admission_number' => 'ADM-2026-001',
            'admission_date' => now(),
            'status' => 'active',
        ]);
        SchoolClass::create([
            'organization_id' => $org->id,
            'name' => 'Grade 10A',
        ]);

        // Subscription expired yesterday
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $starterPlan->id,
            'user_id' => $owner->id,
            'status' => OrganizationSubscription::STATUS_TRIALING,
            'billing_interval' => 'monthly',
            'currency' => 'USD',
            'trial_ends_at' => Carbon::now()->subDay(),
        ]);

        Artisan::call('subscriptions:check-trials');

        $sub->refresh();
        $this->assertSame(OrganizationSubscription::STATUS_EXPIRED, $sub->status);

        // Verification: School data was NOT deleted
        $this->assertDatabaseHas('organizations', ['id' => $org->id]);
        $this->assertDatabaseHas('student_profiles', ['organization_id' => $org->id, 'admission_number' => 'ADM-2026-001']);
        $this->assertDatabaseHas('school_classes', ['organization_id' => $org->id, 'name' => 'Grade 10A']);

        // Audit history shows trial_expired event
        $this->assertDatabaseHas('subscription_histories', [
            'subscription_id' => $sub->id,
            'event' => 'trial_expired',
            'to_status' => OrganizationSubscription::STATUS_EXPIRED,
        ]);
    }

    /**
     * 14. Test registration workflow with legacy plan slug alias 'bronze' correctly sets up starter plan.
     */
    public function test_registration_with_legacy_plan_slug_alias(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-11-01 12:00:00'));

        $response = $this->post('/register/school', [
            'name' => 'Principal Skinner',
            'email' => 'skinner@springfield.edu',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'school_name' => 'Springfield Elementary',
            'subdomain' => 'springfield',
            'plan' => 'bronze', // Legacy slug
            'billing_interval' => 'annual',
            'organization_type' => 'school',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $org = Organization::where('slug', 'springfield')->firstOrFail();
        $sub = OrganizationSubscription::where('organization_id', $org->id)->firstOrFail();

        $this->assertSame('annual', $sub->billing_interval);
        $this->assertNotNull($sub->subscriptionPlan);
        $this->assertContains($sub->subscriptionPlan->slug, ['starter', 'bronze']);
    }

    /**
     * 15. Test public pricing page returns InstitutoPropio plan configuration.
     */
    public function test_public_pricing_endpoint_returns_plans_and_metadata(): void
    {
        $response = $this->get('/pricing');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('pricing')
            ->has('plans', 4)
            ->where('trial_days', 30)
            ->where('currency', 'USD')
        );
    }
}
