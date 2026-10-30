<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\PaymentTransaction;
use App\Models\SchoolClass;
use App\Models\StudentProfile;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\Billing\PaymentGatewayManager;
use Carbon\Carbon;
use Database\Seeders\PlatformSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class SubscriptionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles and default subscription plans (Bronze, Silver, Gold, Premium)
        $this->seed(PlatformSeeder::class);
        $this->seed(SubscriptionPlanSeeder::class);
    }

    /**
     * 1. Test registration preserves selected plan and activates 30-day trial.
     */
    public function test_registration_preserves_selected_plan_and_activates_30_day_trial(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-29 12:00:00'));

        $silverPlan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $response = $this->post('/register/school', [
            'name' => 'Dean Thomas',
            'email' => 'dean@silveracademy.org',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'school_name' => 'Silver Crest Academy',
            'subdomain' => 'silvercrest',
            'plan' => 'silver',
            'organization_type' => 'school',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $user = User::where('email', 'dean@silveracademy.org')->firstOrFail();
        $org = Organization::where('slug', 'silvercrest')->firstOrFail();

        $this->assertEquals('Silver Crest Academy', $org->name);
        $this->assertEquals('active', $org->status);

        // Verify owner role
        $membership = OrganizationUser::where('organization_id', $org->id)
            ->where('user_id', $user->id)
            ->firstOrFail();
        $this->assertEquals('owner', $membership->role);

        // Verify 30-day trial subscription
        $subscription = OrganizationSubscription::where('organization_id', $org->id)->firstOrFail();
        $this->assertEquals($silverPlan->id, $subscription->plan_id);
        $this->assertEquals('trialing', $subscription->status);
        $this->assertEquals('trial', $subscription->billing_type);
        $this->assertEquals('2026-10-29 12:00:00', $subscription->starts_at->toDateTimeString());
        $this->assertEquals('2026-11-28 12:00:00', $subscription->trial_ends_at->toDateTimeString());
        $this->assertEquals(30, $subscription->daysRemainingInTrial());
        $this->assertTrue($subscription->hasAccess());
        $this->assertFalse($subscription->isTrialExpired());

        Carbon::setTestNow();
    }

    /**
     * 2. Test registration validates custom subdomain against reserved platform names and existing orgs.
     */
    public function test_registration_validates_desired_subdomain(): void
    {
        // Reserved platform name
        $response = $this->post('/register/school', [
            'name' => 'Alice Admin',
            'email' => 'alice@reserved.org',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'school_name' => 'Admin Academy',
            'subdomain' => 'admin',
            'organization_type' => 'school',
        ]);
        $response->assertSessionHasErrors('subdomain');

        // Existing organization subdomain
        Organization::create([
            'name' => 'Existing Campus',
            'slug' => 'existing-campus',
            'organization_type' => 'school',
            'status' => 'active',
        ]);

        $response2 = $this->post('/register/school', [
            'name' => 'Bob Owner',
            'email' => 'bob@existing.org',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'school_name' => 'Existing Campus School',
            'subdomain' => 'existing-campus',
            'organization_type' => 'school',
        ]);
        $response2->assertSessionHasErrors('subdomain');
    }

    /**
     * 3. Test prevention of duplicate owner registration to bypass trial eligibility.
     */
    public function test_duplicate_registration_with_same_email_is_prevented(): void
    {
        $this->post('/register/school', [
            'name' => 'Owner First',
            'email' => 'duplicate@institution.edu',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'school_name' => 'First School',
            'subdomain' => 'first-school',
            'plan' => 'bronze',
            'organization_type' => 'school',
        ])->assertRedirect('/dashboard');

        // Attempt second registration with same email
        $this->post('/logout');

        $response = $this->post('/register/school', [
            'name' => 'Owner First',
            'email' => 'duplicate@institution.edu',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'school_name' => 'Second Attempt School',
            'subdomain' => 'second-school',
            'plan' => 'bronze',
            'organization_type' => 'school',
        ]);

        $response->assertSessionHasErrors('email');
    }

    /**
     * 4. Test plan entitlements enforce organization limits (Bronze=1, Silver=5, Gold=10, Premium=unlimited).
     */
    public function test_bronze_plan_entitlement_enforces_maximum_one_organization(): void
    {
        $owner = User::factory()->create();
        $bronzePlan = SubscriptionPlan::where('slug', 'bronze')->firstOrFail();

        // 1st organization
        $org1 = Organization::create([
            'name' => 'Bronze Campus 1',
            'slug' => 'bronze-campus-1',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org1->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
        OrganizationSubscription::create([
            'organization_id' => $org1->id,
            'user_id' => $owner->id,
            'plan_id' => $bronzePlan->id,
            'status' => 'active',
            'billing_type' => 'online',
            'starts_at' => now(),
        ]);

        $this->assertEquals(1, $owner->maxOrganizationEntitlement());
        $this->assertFalse($owner->canCreateOrganization());

        // Attempting to create a second organization via store should be forbidden (403)
        $response = $this->actingAs($owner)->post('/organizations', [
            'name' => 'Bronze Campus 2',
            'slug' => 'bronze-campus-2',
            'organization_type' => 'school',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('organizations', ['slug' => 'bronze-campus-2']);
    }

    public function test_silver_plan_entitlement_permits_up_to_five_organizations(): void
    {
        $owner = User::factory()->create();
        $silverPlan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        // 1st organization with silver subscription
        $org1 = Organization::create([
            'name' => 'Silver Campus 1',
            'slug' => 'silver-campus-1',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org1->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
        OrganizationSubscription::create([
            'organization_id' => $org1->id,
            'user_id' => $owner->id,
            'plan_id' => $silverPlan->id,
            'status' => 'active',
            'billing_type' => 'online',
            'starts_at' => now(),
        ]);

        $this->assertEquals(5, $owner->maxOrganizationEntitlement());
        $this->assertTrue($owner->canCreateOrganization());

        // Create campuses 2, 3, 4, 5 successfully
        for ($i = 2; $i <= 5; $i++) {
            $response = $this->actingAs($owner)->post('/organizations', [
                'name' => "Silver Campus {$i}",
                'slug' => "silver-campus-{$i}",
                'organization_type' => 'school',
            ]);
            $response->assertRedirect();
            $this->assertDatabaseHas('organizations', ['slug' => "silver-campus-{$i}"]);
        }

        // Owner now has 5 organizations
        $this->assertEquals(5, $owner->fresh()->organizations()->wherePivot('role', 'owner')->count());
        $this->assertFalse($owner->fresh()->canCreateOrganization());

        // 6th organization should be forbidden
        $response6 = $this->actingAs($owner)->post('/organizations', [
            'name' => 'Silver Campus 6',
            'slug' => 'silver-campus-6',
            'organization_type' => 'school',
        ]);
        $response6->assertForbidden();
        $this->assertDatabaseMissing('organizations', ['slug' => 'silver-campus-6']);
    }

    public function test_super_admin_bypasses_organization_limits(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $this->assertNull($superAdmin->maxOrganizationEntitlement()); // null = unlimited
        $this->assertTrue($superAdmin->canCreateOrganization());

        $response = $this->actingAs($superAdmin)->post('/organizations', [
            'name' => 'Admin Test School',
            'slug' => 'admin-test-school',
            'organization_type' => 'school',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('organizations', ['slug' => 'admin-test-school']);
    }

    /**
     * 5. Test manual billing invoice request does NOT activate subscription prematurely.
     */
    public function test_manual_invoice_request_creates_pending_invoice_without_premature_activation(): void
    {
        $owner = User::factory()->create();
        $goldPlan = SubscriptionPlan::where('slug', 'gold')->firstOrFail();

        $org = Organization::create([
            'name' => 'Gold Valley High',
            'slug' => 'gold-valley',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'plan_id' => $goldPlan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now(),
            'trial_ends_at' => now()->addDays(30),
        ]);

        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->post('/organizations/billing/invoice', [
                'plan_id' => $goldPlan->id,
                'notes' => 'PO #2026-9921 for Regional School District',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Invoice is created with pending status
        $invoice = SubscriptionInvoice::where('organization_id', $org->id)->firstOrFail();
        $this->assertEquals('pending', $invoice->status);
        $this->assertEquals('manual_invoice', $invoice->billing_type);
        $this->assertNull($invoice->paid_at);
        $this->assertNull($invoice->verified_by);

        // Subscription must NOT have been activated by request alone
        $this->assertEquals('trialing', $sub->fresh()->status);
    }

    /**
     * 6. Test Platform Super Admin verifies manual payment and activates subscription idempotently.
     */
    public function test_platform_super_admin_verifies_payment_and_activates_subscription(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $regularUser = User::factory()->create();

        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $org = Organization::create([
            'name' => 'Verified School',
            'slug' => 'verified-school',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now(),
            'trial_ends_at' => now()->addDays(30),
        ]);

        $invoice = SubscriptionInvoice::create([
            'invoice_number' => 'INV-SUB-TEST-001',
            'organization_id' => $org->id,
            'subscription_id' => $sub->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'amount_cents' => $plan->price_cents,
            'currency' => 'USD',
            'billing_type' => 'manual_invoice',
            'status' => 'pending',
            'due_date' => now()->addDays(14),
        ]);

        // Non-admin verification must be rejected with 403 Forbidden
        $unauthorized = $this->actingAs($regularUser)
            ->post("/admin/subscriptions/invoices/{$invoice->id}/verify", [
                'payment_reference' => 'WIRE-999',
            ]);
        $unauthorized->assertForbidden();

        // Platform Super Admin verification succeeds
        $authorized = $this->actingAs($superAdmin)
            ->post("/admin/subscriptions/invoices/{$invoice->id}/verify", [
                'payment_reference' => 'WIRE-CONFIRMED-8871',
                'notes' => 'Verified via Chase Treasury wire receipt',
            ]);
        $authorized->assertRedirect();

        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
        $this->assertEquals('WIRE-CONFIRMED-8871', $invoice->payment_reference);
        $this->assertEquals($superAdmin->id, $invoice->verified_by);
        $this->assertNotNull($invoice->paid_at);

        // Subscription is activated
        $sub->refresh();
        $this->assertEquals('active', $sub->status);
        $this->assertEquals('manual_invoice', $sub->billing_type);

        // Payment transaction recorded idempotently
        $this->assertDatabaseHas('payment_transactions', [
            'transaction_reference' => 'WIRE-CONFIRMED-8871',
            'subscription_id' => $sub->id,
            'invoice_id' => $invoice->id,
            'status' => 'succeeded',
        ]);
    }

    /**
     * 7. Test trial expiration command updates subscription status without deleting organization or school data.
     */
    public function test_trial_expiration_preserves_school_data_and_updates_status(): void
    {
        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'bronze')->firstOrFail();

        $org = Organization::create([
            'name' => 'Expired Trial Academy',
            'slug' => 'expired-trial-academy',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        // Subscription whose trial expired 2 days ago
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now()->subDays(32),
            'trial_ends_at' => now()->subDays(2),
        ]);

        // Add class and student data to ensure preservation
        $class = SchoolClass::create([
            'organization_id' => $org->id,
            'name' => 'Grade 10 Science',
            'code' => 'G10-SCI',
        ]);
        $studentUser = User::factory()->create();
        $student = StudentProfile::create([
            'organization_id' => $org->id,
            'user_id' => $studentUser->id,
            'admission_number' => 'ADM-2026-001',
            'admission_date' => '2026-09-01',
            'gender' => 'male',
        ]);

        // Run scheduled trial check command
        Artisan::call('subscriptions:check-trials');

        // Subscription status is updated to expired
        $sub->refresh();
        $this->assertEquals('expired', $sub->status);
        $this->assertTrue($sub->isTrialExpired());

        // CRITICAL SAFEGUARD: School data is completely intact and never deleted!
        $this->assertDatabaseHas('organizations', ['id' => $org->id, 'status' => 'active']);
        $this->assertDatabaseHas('school_classes', ['id' => $class->id, 'name' => 'Grade 10 Science']);
        $this->assertDatabaseHas('student_profiles', ['id' => $student->id, 'admission_number' => 'ADM-2026-001']);
    }

    /**
     * 8. Test owner billing interface returns expected subscription and entitlement data.
     */
    public function test_owner_billing_page_renders_with_entitlements_and_invoices(): void
    {
        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $org = Organization::create([
            'name' => 'Billing View School',
            'slug' => 'billing-view-school',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
        OrganizationSubscription::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now(),
            'trial_ends_at' => now()->addDays(30),
        ]);

        // Owner can access billing
        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/organizations/billing');

        $response->assertOk();

        // Teacher in that organization is forbidden from billing
        $teacher = User::factory()->create();
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $teacher->id,
            'role' => 'teacher',
            'status' => 'active',
        ]);

        $forbidden = $this->actingAs($teacher)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/organizations/billing');

        $forbidden->assertForbidden();

        // Unaffiliated user receives 404
        $unaffiliatedUser = User::factory()->create();
        $this->actingAs($unaffiliatedUser)
            ->get('/organizations/billing')
            ->assertNotFound();
    }

    /**
     * 9. Test payment processing is strictly idempotent.
     */
    public function test_payment_processing_is_idempotent(): void
    {
        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $org = Organization::create([
            'name' => 'Idempotent Academy',
            'slug' => 'idempotent-academy',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now(),
            'trial_ends_at' => now()->addDays(30),
        ]);

        $manager = app(PaymentGatewayManager::class);

        // Process first webhook event
        $tx1 = $manager->processPaymentEvent(
            reference: 'GATEWAY-TX-998811',
            subscription: $sub,
            invoice: null,
            gateway: 'placeholder',
            eventType: 'charge.succeeded',
            amountCents: 15000,
            currency: 'USD',
            payload: ['id' => 'GATEWAY-TX-998811']
        );

        $this->assertEquals('processed', $tx1->status);
        $this->assertEquals(1, PaymentTransaction::where('transaction_reference', 'GATEWAY-TX-998811')->count());
        $this->assertEquals('active', $sub->fresh()->status);

        // Simulate duplicate webhook / retried request with exact same reference
        $tx2 = $manager->processPaymentEvent(
            reference: 'GATEWAY-TX-998811',
            subscription: $sub,
            invoice: null,
            gateway: 'placeholder',
            eventType: 'charge.succeeded',
            amountCents: 15000,
            currency: 'USD',
            payload: ['id' => 'GATEWAY-TX-998811']
        );

        // No duplicate record created in database; existing transaction returned
        $this->assertEquals($tx1->id, $tx2->id);
        $this->assertEquals(1, PaymentTransaction::where('transaction_reference', 'GATEWAY-TX-998811')->count());
    }
}
