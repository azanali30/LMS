<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class TenantSubdomainTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.domain' => 'lms.test']);
        config(['app.url' => 'http://lms.test']);
    }

    public function test_active_school_subdomain_resolves_and_shares_tenant_branding(): void
    {
        $school = Organization::create([
            'name' => 'Oakridge International Academy',
            'slug' => 'oakridge',
            'organization_type' => 'school',
            'status' => 'active',
            'primary_color' => '#10B981',
            'accent_color' => '#F59E0B',
            'logo_path' => 'https://example.com/oakridge-logo.png',
        ]);

        $response = $this->get('http://oakridge.lms.test/login');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auth/login')
            ->has('tenant')
            ->where('tenant.name', 'Oakridge International Academy')
            ->where('tenant.slug', 'oakridge')
            ->where('tenant.primary_color', '#10B981')
            ->where('tenant.accent_color', '#F59E0B')
            ->where('tenant.logo_path', 'https://example.com/oakridge-logo.png')
        );
    }

    public function test_unknown_school_subdomain_is_rejected_with_404(): void
    {
        $response = $this->get('http://nonexistent-school.lms.test/login');

        $response->assertNotFound();
    }

    public function test_inactive_or_suspended_school_subdomain_is_rejected_with_403(): void
    {
        Organization::create([
            'name' => 'Suspended Academy',
            'slug' => 'suspended-academy',
            'organization_type' => 'school',
            'status' => 'suspended',
        ]);

        $response = $this->get('http://suspended-academy.lms.test/login');

        $response->assertForbidden();
    }

    public function test_reserved_subdomains_are_treated_as_platform_central_routes(): void
    {
        // www.lms.test should not be treated as a tenant
        $response = $this->get('http://www.lms.test/');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('welcome')
            ->where('tenant', null)
        );
    }

    public function test_authenticated_user_without_membership_is_forbidden_from_tenant_subdomain(): void
    {
        $schoolA = Organization::create([
            'name' => 'School Alpha',
            'slug' => 'school-alpha',
            'organization_type' => 'school',
            'status' => 'active',
        ]);

        $schoolB = Organization::create([
            'name' => 'School Beta',
            'slug' => 'school-beta',
            'organization_type' => 'school',
            'status' => 'active',
        ]);

        // User belongs ONLY to School A
        $userA = User::factory()->create(['role' => 'teacher']);
        OrganizationUser::create([
            'organization_id' => $schoolA->id,
            'user_id' => $userA->id,
            'role' => 'teacher',
            'status' => 'active',
        ]);

        // User A attempts to access School B subdomain dashboard
        $response = $this->actingAs($userA)
            ->get('http://school-beta.lms.test/dashboard');

        $response->assertForbidden();
    }

    public function test_authenticated_user_with_active_membership_can_access_tenant_dashboard(): void
    {
        $school = Organization::create([
            'name' => 'Summit Prep',
            'slug' => 'summit-prep',
            'organization_type' => 'school',
            'status' => 'active',
        ]);

        $teacher = User::factory()->create(['role' => 'teacher']);
        OrganizationUser::create([
            'organization_id' => $school->id,
            'user_id' => $teacher->id,
            'role' => 'teacher',
            'status' => 'active',
        ]);

        $response = $this->actingAs($teacher)
            ->get('http://summit-prep.lms.test/dashboard');

        $response->assertOk();
        $this->assertEquals($school->id, TenantContext::id());
    }

    public function test_platform_super_admin_can_access_any_school_subdomain(): void
    {
        $school = Organization::create([
            'name' => 'Horizon Academy',
            'slug' => 'horizon',
            'organization_type' => 'academy',
            'status' => 'active',
        ]);

        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($superAdmin)
            ->get('http://horizon.lms.test/dashboard');

        $response->assertOk();
    }

    public function test_desktop_client_resolves_tenant_via_x_tenant_subdomain_header(): void
    {
        $school = Organization::create([
            'name' => 'Tauri Desktop Academy',
            'slug' => 'desktop-academy',
            'organization_type' => 'academy',
            'status' => 'active',
        ]);

        $response = $this->withHeader('X-Tenant-Subdomain', 'desktop-academy')
            ->get('/login');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auth/login')
            ->where('tenant.slug', 'desktop-academy')
            ->where('tenant.name', 'Tauri Desktop Academy')
        );
    }

    public function test_cannot_create_organization_with_reserved_slug(): void
    {
        $owner = User::factory()->create(['role' => 'student']);
        $school = Organization::create([
            'name' => 'Starter Org',
            'slug' => 'starter-org',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $school->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $response = $this->actingAs($owner)->post('/organizations', [
            'name' => 'API Gateway Org',
            'slug' => 'api', // reserved!
            'organization_type' => 'school',
        ]);

        $response->assertSessionHasErrors(['slug']);
        $this->assertDatabaseMissing('organizations', ['name' => 'API Gateway Org']);
    }

    public function test_organization_settings_can_update_branding_colors_and_logo(): void
    {
        $owner = User::factory()->create(['role' => 'student']);
        $school = Organization::create([
            'name' => 'Crestview High',
            'slug' => 'crestview',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $school->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $school->id])
            ->put('/organizations/settings', [
                'name' => 'Crestview High School',
                'organization_type' => 'school',
                'primary_color' => '#4F46E5',
                'accent_color' => '#EC4899',
                'logo_path' => 'https://example.com/crest.png',
            ]);

        $response->assertSessionHas('success');

        $school->refresh();
        $this->assertEquals('Crestview High School', $school->name);
        $this->assertEquals('#4F46E5', $school->primary_color);
        $this->assertEquals('#EC4899', $school->accent_color);
        $this->assertEquals('https://example.com/crest.png', $school->logo_path);
    }

    public function test_central_login_does_not_guess_arbitrary_school(): void
    {
        // On central platform domain, login renders with tenant null (no arbitrary school assigned)
        $response = $this->get('http://lms.test/login');

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auth/login')
            ->where('tenant', null)
        );
    }

    public function test_login_dropdown_destinations_are_valid(): void
    {
        // 1. Login destination
        $this->get('/login')->assertOk();

        // 2. Download Desktop App destination
        $this->get('/download')->assertOk();

        // 3. Register School Free destination
        $this->get('/register?journey=school')->assertOk();
    }
}
