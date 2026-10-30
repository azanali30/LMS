<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\FeeInvoice;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\SchoolClass;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Notifications\TrialExpiringNotification;
use App\Services\Billing\PaymentGatewayManager;
use Carbon\Carbon;
use Database\Seeders\PlatformSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SecurityAndIntegrationAuditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PlatformSeeder::class);
        $this->seed(SubscriptionPlanSeeder::class);
    }

    /**
     * 1. Tenant Isolation: A user from Org A cannot access or modify Org B's resources.
     */
    public function test_tenant_isolation_cross_organization_resource_access_is_blocked(): void
    {
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();

        $orgA = Organization::create([
            'name' => 'Campus Alpha',
            'slug' => 'campus-alpha',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $ownerA->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $orgA->id,
            'user_id' => $ownerA->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $orgB = Organization::create([
            'name' => 'Campus Beta',
            'slug' => 'campus-beta',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $ownerB->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $orgB->id,
            'user_id' => $ownerB->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        // Invoice belonging to Org B
        $ayB = AcademicYear::create([
            'organization_id' => $orgB->id,
            'name' => '2026-2027 Session',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
        ]);
        $classB = SchoolClass::create([
            'organization_id' => $orgB->id,
            'name' => 'Class Beta',
            'code' => 'CB-01',
        ]);
        $studentUserB = User::factory()->create();
        $invoiceB = FeeInvoice::create([
            'organization_id' => $orgB->id,
            'student_id' => $studentUserB->id,
            'school_class_id' => $classB->id,
            'academic_year_id' => $ayB->id,
            'invoice_number' => 'INV-BETA-001',
            'billing_month' => '2026-10-01',
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-15',
            'subtotal' => 500,
            'total_amount' => 500,
            'paid_amount' => 0,
            'balance_due' => 500,
            'status' => 'unpaid',
            'currency' => 'USD',
            'created_by' => $ownerB->id,
        ]);

        // Owner A tries to download Org B's invoice while in Org A context
        $response = $this->actingAs($ownerA)
            ->withSession(['current_organization_id' => $orgA->id])
            ->get("/school/fees/invoices/{$invoiceB->id}/download");

        // Rejected either by TenantScope route model binding (404) or authorization (403)
        $this->assertTrue(in_array($response->status(), [403, 404], true));

        // Owner A tries to record payment on Org B's invoice
        $payResponse = $this->actingAs($ownerA)
            ->withSession(['current_organization_id' => $orgA->id])
            ->post("/school/fees/invoices/{$invoiceB->id}/payments", [
                'amount' => 500,
                'payment_method' => 'cash',
                'paid_at' => now()->toDateString(),
            ]);

        $this->assertTrue(in_array($payResponse->status(), [403, 404], true));
    }

    /**
     * 2. Trial Expiry: Confirmed read_only policy permits inspection but blocks write operations.
     */
    public function test_expired_trial_enforces_read_only_policy_blocking_write_requests(): void
    {
        Config::set('billing.expiry_policy', 'read_only');

        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'bronze')->firstOrFail();

        $org = Organization::create([
            'name' => 'Expired School',
            'slug' => 'expired-school',
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
            'status' => 'expired',
            'billing_type' => 'trial',
            'starts_at' => now()->subDays(35),
            'trial_ends_at' => now()->subDays(5),
        ]);

        // GET requests (Read-Only Inspection) are permitted
        $getResponse = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/school/classes');
        $getResponse->assertOk();

        // POST requests to modify operational data (e.g. creating a class) are blocked with 403
        $postResponse = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->post('/school/classes', [
                'name' => 'Disallowed Class',
            ]);
        $postResponse->assertForbidden();
        $this->assertDatabaseMissing('school_classes', ['name' => 'Disallowed Class']);

        // Exemption: Owner can still access billing and request an invoice
        $billingResponse = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/organizations/billing');
        $billingResponse->assertOk();

        $invoiceResponse = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->post('/organizations/billing/invoice', [
                'plan_id' => $plan->id,
                'notes' => 'Renewal for expired workspace',
            ]);
        $invoiceResponse->assertRedirect();
        $this->assertDatabaseHas('subscription_invoices', [
            'organization_id' => $org->id,
            'status' => 'pending',
        ]);

        // Super Admin bypasses read-only restriction
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $adminResponse = $this->actingAs($superAdmin)
            ->withSession(['current_organization_id' => $org->id])
            ->post('/school/classes', [
                'name' => 'Super Admin Class',
            ]);
        $adminResponse->assertRedirect();
        $this->assertDatabaseHas('school_classes', ['name' => 'Super Admin Class']);
    }

    /**
     * 3. Trial Expiry: Confirmed locked policy blocks non-exempt routes.
     */
    public function test_expired_trial_under_locked_policy_blocks_general_workspace_access(): void
    {
        Config::set('billing.expiry_policy', 'locked');

        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'bronze')->firstOrFail();

        $org = Organization::create([
            'name' => 'Locked School',
            'slug' => 'locked-school',
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
            'status' => 'expired',
            'billing_type' => 'trial',
            'starts_at' => now()->subDays(35),
            'trial_ends_at' => now()->subDays(5),
        ]);

        // In locked policy, even GET to school classes is blocked
        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/school/classes');
        $response->assertForbidden();

        // But billing remains accessible so they can pay and unlock
        $billingResponse = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/organizations/billing');
        $billingResponse->assertOk();
    }

    /**
     * 4. Billing Authorization: Non-admin users cannot verify manual payments.
     */
    public function test_non_admin_cannot_verify_payment(): void
    {
        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $org = Organization::create([
            'name' => 'Tamper School',
            'slug' => 'tamper-school',
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
            'invoice_number' => 'INV-TAMPER-001',
            'organization_id' => $org->id,
            'subscription_id' => $sub->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'amount_cents' => 15000,
            'currency' => 'USD',
            'billing_type' => 'manual_invoice',
            'status' => 'pending',
            'due_date' => now()->addDays(14),
        ]);

        // The owner themselves cannot verify payment
        $response = $this->actingAs($owner)
            ->post("/admin/subscriptions/invoices/{$invoice->id}/verify", [
                'payment_reference' => 'FORGED-REF-123',
            ]);

        $response->assertForbidden();
        $this->assertEquals('pending', $invoice->fresh()->status);
        $this->assertEquals('trialing', $sub->fresh()->status);
    }

    /**
     * 5. Payment Event Integrity: Rejects underpayments, currency mismatch, and mismatched organization invoices.
     */
    public function test_payment_event_integrity_validations(): void
    {
        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $orgA = Organization::create([
            'name' => 'Integrity Org A',
            'slug' => 'integrity-org-a',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        $orgB = Organization::create([
            'name' => 'Integrity Org B',
            'slug' => 'integrity-org-b',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);

        $subA = OrganizationSubscription::create([
            'organization_id' => $orgA->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now(),
        ]);

        $invoiceA = SubscriptionInvoice::create([
            'invoice_number' => 'INV-INT-001',
            'organization_id' => $orgA->id,
            'subscription_id' => $subA->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'amount_cents' => 20000,
            'currency' => 'USD',
            'billing_type' => 'online',
            'status' => 'pending',
        ]);

        $invoiceB = SubscriptionInvoice::create([
            'invoice_number' => 'INV-INT-002',
            'organization_id' => $orgB->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'amount_cents' => 20000,
            'currency' => 'USD',
            'billing_type' => 'online',
            'status' => 'pending',
        ]);

        $manager = app(PaymentGatewayManager::class);

        // A. Reject underpayment
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Underpayment detected');
        $manager->processPaymentEvent(
            reference: 'TX-UNDERPAY',
            subscription: $subA,
            invoice: $invoiceA,
            gateway: 'test',
            eventType: 'charge.succeeded',
            amountCents: 5000, // Expected 20000
            currency: 'USD'
        );
    }

    public function test_payment_event_integrity_rejects_currency_mismatch(): void
    {
        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $org = Organization::create([
            'name' => 'Currency Org',
            'slug' => 'currency-org',
            'organization_type' => 'school',
            'status' => 'active',
        ]);
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now(),
        ]);
        $invoice = SubscriptionInvoice::create([
            'invoice_number' => 'INV-CURR-001',
            'organization_id' => $org->id,
            'subscription_id' => $sub->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'amount_cents' => 20000,
            'currency' => 'USD',
            'billing_type' => 'online',
            'status' => 'pending',
        ]);

        $manager = app(PaymentGatewayManager::class);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Currency mismatch');
        $manager->processPaymentEvent(
            reference: 'TX-CURR-FAIL',
            subscription: $sub,
            invoice: $invoice,
            gateway: 'test',
            eventType: 'charge.succeeded',
            amountCents: 20000,
            currency: 'EUR' // Invoice expects USD
        );
    }

    public function test_payment_event_integrity_rejects_mismatched_organization_invoice(): void
    {
        $owner = User::factory()->create();
        $plan = SubscriptionPlan::where('slug', 'silver')->firstOrFail();

        $orgA = Organization::create(['name' => 'Org A', 'slug' => 'org-a', 'status' => 'active']);
        $orgB = Organization::create(['name' => 'Org B', 'slug' => 'org-b', 'status' => 'active']);

        $subA = OrganizationSubscription::create([
            'organization_id' => $orgA->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now(),
        ]);

        $invoiceB = SubscriptionInvoice::create([
            'invoice_number' => 'INV-MISMATCH',
            'organization_id' => $orgB->id, // Belongs to B
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'amount_cents' => 20000,
            'currency' => 'USD',
            'status' => 'pending',
        ]);

        $manager = app(PaymentGatewayManager::class);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Mismatched invoice');
        $manager->processPaymentEvent(
            reference: 'TX-MISMATCH-FAIL',
            subscription: $subA,
            invoice: $invoiceB, // Attempting to link Org B invoice to Org A subscription
            gateway: 'test',
            eventType: 'charge.succeeded',
            amountCents: 20000,
            currency: 'USD'
        );
    }

    /**
     * 6. Active Plan Inheritance: Newly provisioned organization inherits owner's active plan.
     */
    public function test_additional_organization_inherits_owners_active_plan(): void
    {
        $owner = User::factory()->create();
        $goldPlan = SubscriptionPlan::where('slug', 'gold')->firstOrFail();

        $org1 = Organization::create([
            'name' => 'Gold Campus 1',
            'slug' => 'gold-campus-1',
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
            'plan_id' => $goldPlan->id,
            'status' => 'active',
            'billing_type' => 'online',
            'starts_at' => now(),
            'ends_at' => now()->addYear(),
        ]);

        // Owner creates 2nd organization
        $response = $this->actingAs($owner)->post('/organizations', [
            'name' => 'Gold Campus 2',
            'slug' => 'gold-campus-2',
            'organization_type' => 'school',
        ]);

        $response->assertRedirect();
        $org2 = Organization::where('slug', 'gold-campus-2')->firstOrFail();
        $sub2 = $org2->subscription;

        $this->assertNotNull($sub2);
        $this->assertEquals($goldPlan->id, $sub2->plan_id);
        $this->assertEquals('active', $sub2->status);
    }

    /**
     * 7. Scheduled Reminders: Dispatches TrialExpiringNotification to owner via proper channels.
     */
    public function test_trial_check_command_dispatches_notification_through_proper_channels(): void
    {
        Notification::fake();

        $owner = User::factory()->create(['email' => 'owner.notif@institution.edu']);
        $plan = SubscriptionPlan::where('slug', 'bronze')->firstOrFail();

        $org = Organization::create([
            'name' => 'Reminder Academy',
            'slug' => 'reminder-academy',
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

        // Trial expiring in exactly 7 days (one of the reminder intervals)
        $sub = OrganizationSubscription::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'plan_id' => $plan->id,
            'status' => 'trialing',
            'billing_type' => 'trial',
            'starts_at' => now()->subDays(23),
            'trial_ends_at' => now()->addDays(7),
        ]);

        Artisan::call('subscriptions:check-trials');

        Notification::assertSentTo(
            $owner,
            TrialExpiringNotification::class,
            function (TrialExpiringNotification $notification) use ($sub) {
                return $notification->subscription->id === $sub->id
                    && $notification->daysRemaining === 7;
            }
        );

        $this->assertNotNull($sub->fresh()->last_reminded_at);
    }
}
