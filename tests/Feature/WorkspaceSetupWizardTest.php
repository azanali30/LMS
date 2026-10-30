<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WorkspaceSetupWizardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SubscriptionPlanSeeder::class);
    }

    public function test_newly_registered_user_without_organization_is_redirected_to_setup_wizard(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
        ]);
        $user->markEmailAsVerified();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('workspace.setup'));
    }

    public function test_authenticated_user_can_render_setup_wizard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('workspace.setup'));

        $response->assertOk();
    }

    public function test_check_slug_endpoint_reports_availability_correctly(): void
    {
        $user = User::factory()->create();

        // 1. Available slug
        $response = $this->actingAs($user)->getJson('/workspace/setup/check-slug?slug=st-marys-academy');
        $response->assertOk();
        $response->assertJson([
            'available' => true,
            'slug' => 'st-marys-academy',
        ]);

        // 2. Reserved subdomain
        $response = $this->actingAs($user)->getJson('/workspace/setup/check-slug?slug=admin');
        $response->assertOk();
        $response->assertJson([
            'available' => false,
        ]);

        // 3. Already taken slug
        Organization::create([
            'name' => 'Existing Academy',
            'slug' => 'existing-academy',
            'organization_type' => 'academy',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->getJson('/workspace/setup/check-slug?slug=existing-academy');
        $response->assertOk();
        $response->assertJson([
            'available' => false,
        ]);
    }

    public function test_user_can_create_workspace_via_setup_wizard_with_branding_and_academics(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $logo = UploadedFile::fake()->image('crest.png', 200, 200);

        $payload = [
            'name' => 'Oakridge International Academy',
            'slug' => 'oakridge-intl',
            'organization_type' => 'academy',
            'primary_color' => '#7c3aed',
            'accent_color' => '#f59e0b',
            'logo' => $logo,
            'academic_session_name' => '2026-2027 Fall-Spring Session',
            'academic_start_date' => '2026-09-01',
            'academic_end_date' => '2027-06-30',
            'timezone' => 'America/New_York',
            'currency' => 'USD',
            'plan' => 'bronze',
        ];

        $response = $this->actingAs($user)->post('/workspace/setup', $payload);

        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('success');

        // Verify organization created
        $org = Organization::where('slug', 'oakridge-intl')->first();
        $this->assertNotNull($org);
        $this->assertEquals('Oakridge International Academy', $org->name);
        $this->assertEquals('academy', $org->organization_type);
        $this->assertEquals('#7c3aed', $org->primary_color);
        $this->assertEquals('USD', $org->currency);
        $this->assertEquals('America/New_York', $org->timezone);
        $this->assertNotNull($org->logo_path);

        // Verify owner membership created
        $this->assertDatabaseHas('organization_user', [
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        // Verify academic year and terms created
        $this->assertDatabaseHas('academic_years', [
            'organization_id' => $org->id,
            'name' => '2026-2027 Fall-Spring Session',
            'is_current' => true,
        ]);

        $this->assertDatabaseHas('academic_terms', [
            'organization_id' => $org->id,
            'name' => 'Fall Term (First Half)',
        ]);

        // Verify 30-day free trial attached
        $sub = OrganizationSubscription::where('organization_id', $org->id)->first();
        $this->assertNotNull($sub);
        $this->assertEquals(OrganizationSubscription::STATUS_TRIALING, $sub->status);
        $this->assertEquals('trial', $sub->billing_type);
        $this->assertNotNull($sub->trial_ends_at);
        $this->assertTrue($sub->trial_ends_at->isFuture());
    }

    public function test_setup_wizard_rejects_reserved_slugs(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/workspace/setup', [
            'name' => 'System Administration',
            'slug' => 'admin',
            'organization_type' => 'school',
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    public function test_user_with_active_organization_is_redirected_to_dashboard_from_setup_wizard(): void
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Apex High',
            'slug' => 'apex-high',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->get(route('workspace.setup'));

        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('info');
    }

    public function test_user_at_quota_limit_is_forbidden_from_creating_additional_workspace(): void
    {
        $bronzePlan = SubscriptionPlan::where('slug', 'bronze')->first();
        $user = User::factory()->create();

        $org1 = Organization::create([
            'name' => 'First School',
            'slug' => 'first-school',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $org1->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $org1->subscriptions()->create([
            'plan_id' => $bronzePlan->id,
            'user_id' => $user->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'starts_at' => now(),
            'billing_type' => 'online',
        ]);

        // Attempting to access setup wizard with ?new=1 or create another school should be 403 forbidden
        $response = $this->actingAs($user)->get('/workspace/setup?new=1');
        $response->assertForbidden();

        $postResponse = $this->actingAs($user)->post('/workspace/setup', [
            'name' => 'Second School Attempt',
            'slug' => 'second-school',
            'organization_type' => 'school',
        ]);
        $postResponse->assertForbidden();
    }

    public function test_individual_learner_renders_learner_dashboard_without_redirect_to_wizard(): void
    {
        $user = User::factory()->create([
            'role' => 'learner',
        ]);
        $user->markEmailAsVerified();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertOk();
    }
}
