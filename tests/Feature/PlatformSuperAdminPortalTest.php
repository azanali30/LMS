<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\PaymentApprovalRequest;
use App\Models\PlatformAnnouncement;
use App\Models\PlatformAuditLog;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PlatformSuperAdminPortalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure default starter plan exists
        SubscriptionPlan::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'price_cents' => 1900,
            'price_annual_cents' => 19000,
            'currency' => 'USD',
            'billing_interval' => 'month',
            'max_organizations' => 1,
            'is_active' => true,
        ]);
    }

    protected function createSuperAdmin(string $email = 'superadmin@institutopropio.com'): User
    {
        return User::create([
            'name' => 'Platform Super Admin',
            'email' => $email,
            'password' => Hash::make('SuperSecretPassword123!'),
            'role' => 'super_admin',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    protected function createNormalUser(string $role = 'student', string $email = 'user@campus.edu'): User
    {
        return User::create([
            'name' => 'Campus User',
            'email' => $email,
            'password' => Hash::make('Password123!'),
            'role' => $role,
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    public function test_unauthenticated_user_cannot_access_platform_admin_and_is_redirected_to_login(): void
    {
        $response = $this->get('/platform-admin/dashboard');
        $response->assertRedirect(route('platform-admin.login'));
    }

    public function test_normal_student_cannot_access_platform_admin_routes(): void
    {
        $user = $this->createNormalUser('student');

        $response = $this->actingAs($user)->get('/platform-admin/dashboard');
        $response->assertForbidden();
    }

    public function test_organization_owner_cannot_access_platform_admin_routes(): void
    {
        $owner = $this->createNormalUser('student', 'owner@school.org');
        $org = Organization::create([
            'name' => 'Oakridge Academy',
            'slug' => 'oakridge',
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

        $response = $this->actingAs($owner)->get('/platform-admin/dashboard');
        $response->assertForbidden();
    }

    public function test_super_admin_can_view_login_page(): void
    {
        $response = $this->get('/platform-admin/login');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('platform-admin/auth/login'));
    }

    public function test_super_admin_can_login_with_valid_credentials(): void
    {
        $admin = $this->createSuperAdmin();

        $response = $this->post('/platform-admin/login', [
            'email' => 'superadmin@institutopropio.com',
            'password' => 'SuperSecretPassword123!',
        ]);

        $response->assertRedirect(route('platform-admin.dashboard'));
        $this->assertAuthenticatedAs($admin);
    }

    public function test_non_super_admin_is_rejected_at_platform_admin_login(): void
    {
        $this->createNormalUser('student', 'student@school.org');

        $response = $this->post('/platform-admin/login', [
            'email' => 'student@school.org',
            'password' => 'Password123!',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_suspended_super_admin_is_rejected_at_login(): void
    {
        $admin = $this->createSuperAdmin('suspended@institutopropio.com');
        $admin->update(['status' => 'suspended']);

        $response = $this->post('/platform-admin/login', [
            'email' => 'suspended@institutopropio.com',
            'password' => 'SuperSecretPassword123!',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_super_admin_can_access_dashboard_with_actual_metrics(): void
    {
        $admin = $this->createSuperAdmin();

        $org = Organization::create([
            'name' => 'Metro High',
            'slug' => 'metro-high',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->get('/platform-admin/dashboard');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('platform-admin/dashboard')
            ->has('metrics')
            ->where('metrics.totalOrganizations', 1)
            ->where('metrics.totalUsers', 1)
        );
    }

    public function test_super_admin_can_suspend_and_reactivate_organization(): void
    {
        $admin = $this->createSuperAdmin();

        $org = Organization::create([
            'name' => 'Test School',
            'slug' => 'test-school',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        // Suspend
        $response = $this->actingAs($admin)->post("/platform-admin/organizations/{$org->id}/status", [
            'status' => 'suspended',
            'reason' => 'Payment delinquency',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('suspended', $org->fresh()->status);

        // Reactivate
        $response = $this->actingAs($admin)->post("/platform-admin/organizations/{$org->id}/status", [
            'status' => 'active',
            'reason' => 'Invoice settled',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('active', $org->fresh()->status);
    }

    public function test_super_admin_can_update_organization_plan(): void
    {
        $admin = $this->createSuperAdmin();

        $org = Organization::create([
            'name' => 'Campus Delta',
            'slug' => 'campus-delta',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $admin->id,
        ]);

        $goldPlan = SubscriptionPlan::create([
            'name' => 'Gold',
            'slug' => 'gold',
            'price_cents' => 9900,
            'price_annual_cents' => 99000,
            'currency' => 'USD',
            'billing_interval' => 'month',
            'max_organizations' => 10,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->post("/platform-admin/organizations/{$org->id}/change-plan", [
            'plan_id' => $goldPlan->id,
            'billing_interval' => 'annual',
            'status' => 'active',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals($goldPlan->id, $org->fresh()->subscription->plan_id);
        $this->assertEquals('annual', $org->fresh()->subscription->billing_interval);
    }

    public function test_super_admin_can_suspend_user_but_cannot_suspend_themselves(): void
    {
        $admin = $this->createSuperAdmin();
        $student = $this->createNormalUser('student');

        // Suspend student
        $response = $this->actingAs($admin)->post("/platform-admin/users/{$student->id}/status", [
            'status' => 'suspended',
            'reason' => 'Spam behavior',
        ]);
        $response->assertSessionHas('success');
        $this->assertEquals('suspended', $student->fresh()->status);

        // Try suspending self
        $response = $this->actingAs($admin)->post("/platform-admin/users/{$admin->id}/status", [
            'status' => 'suspended',
        ]);
        $response->assertSessionHas('error');
        $this->assertEquals('active', $admin->fresh()->status);
    }

    public function test_super_admin_can_create_new_pricing_plan(): void
    {
        $admin = $this->createSuperAdmin();

        $response = $this->actingAs($admin)->post('/platform-admin/plans', [
            'name' => 'Premium Multi-Campus',
            'slug' => 'premium-multi',
            'description' => 'Unlimited campuses group',
            'price_cents' => 19900,
            'price_annual_cents' => 199000,
            'max_organizations' => 0, // unlimited
            'features' => ['Unlimited institutions', 'Dedicated account manager'],
            'is_active' => true,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('subscription_plans', [
            'slug' => 'premium-multi',
            'name' => 'Premium Multi-Campus',
        ]);
    }

    public function test_super_admin_can_approve_payment_request(): void
    {
        $admin = $this->createSuperAdmin();

        $req = PaymentApprovalRequest::create([
            'email' => 'applicant@school.com',
            'plan_slug' => 'starter',
            'billing_interval' => 'monthly',
            'amount_cents' => 1900,
            'currency' => 'USD',
            'payment_method' => 'manual_bank_transfer',
            'transaction_reference' => 'TX-TEST-998811',
            'status' => PaymentApprovalRequest::STATUS_PENDING,
        ]);

        $response = $this->actingAs($admin)->post("/platform-admin/payments/{$req->id}/approve");

        $response->assertSessionHas('success');
        $fresh = $req->fresh();
        $this->assertEquals(PaymentApprovalRequest::STATUS_APPROVED, $fresh->status);
        $this->assertNotNull($fresh->completion_token);
        $this->assertEquals($admin->id, $fresh->approved_by);
    }

    public function test_super_admin_can_create_and_publish_announcement(): void
    {
        $admin = $this->createSuperAdmin();

        $response = $this->actingAs($admin)->post('/platform-admin/announcements', [
            'title' => 'Scheduled Upgrade Notice',
            'content' => 'We are rolling out new speed improvements.',
            'type' => 'info',
            'target_audience' => 'all',
            'is_published' => true,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('platform_announcements', [
            'title' => 'Scheduled Upgrade Notice',
            'is_published' => true,
        ]);
    }

    public function test_super_admin_can_reply_to_support_ticket(): void
    {
        $admin = $this->createSuperAdmin();
        $user = $this->createNormalUser();

        $ticket = SupportTicket::create([
            'ticket_number' => 'TICK-9001',
            'user_id' => $user->id,
            'subject' => 'Timetable room allocation question',
            'priority' => 'normal',
            'status' => 'open',
        ]);

        $response = $this->actingAs($admin)->post("/platform-admin/support/{$ticket->id}/reply", [
            'message' => 'We have inspected your room schedules and updated the conflicting period.',
            'is_internal_note' => false,
            'new_status' => 'resolved',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('resolved', $ticket->fresh()->status);
        $this->assertDatabaseHas('support_ticket_messages', [
            'ticket_id' => $ticket->id,
            'user_id' => $admin->id,
            'message' => 'We have inspected your room schedules and updated the conflicting period.',
        ]);
    }

    public function test_administrative_actions_record_audit_logs(): void
    {
        $admin = $this->createSuperAdmin();

        PlatformAuditLog::record(
            action: 'test.admin_audit_action',
            details: ['key' => 'value'],
            user: $admin
        );

        $this->assertDatabaseHas('platform_audit_logs', [
            'user_id' => $admin->id,
            'action' => 'test.admin_audit_action',
        ]);
    }

    public function test_super_admin_can_change_password_securely(): void
    {
        $admin = $this->createSuperAdmin('change-pw@institutopropio.com');

        $response = $this->actingAs($admin)->post('/platform-admin/settings/password', [
            'current_password' => 'SuperSecretPassword123!',
            'password' => 'NewExtremelySecurePassword999!',
            'password_confirmation' => 'NewExtremelySecurePassword999!',
        ]);

        $response->assertSessionHas('success');
        $this->assertTrue(Hash::check('NewExtremelySecurePassword999!', $admin->fresh()->password));
    }

    public function test_cli_artisan_command_can_provision_super_admin(): void
    {
        $this->artisan('platform:create-super-admin', [
            '--email' => 'cli-admin@institutopropio.com',
            '--name' => 'CLI Admin',
            '--password' => 'SecureCliPassword999!',
        ])->assertSuccessful();

        $this->assertDatabaseHas('users', [
            'email' => 'cli-admin@institutopropio.com',
            'role' => 'super_admin',
            'status' => 'active',
        ]);
    }
}
