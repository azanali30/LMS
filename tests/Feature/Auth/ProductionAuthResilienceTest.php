<?php

namespace Tests\Feature\Auth;

use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passkeys\Passkeys;
use Tests\TestCase;

class ProductionAuthResilienceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test /login renders with HTTP 200.
     */
    public function test_login_route_renders_successfully(): void
    {
        $response = $this->get('/login');

        $response->assertOk();
    }

    /**
     * Test /register renders with HTTP 200 even when database has no subscription plans seeded.
     */
    public function test_register_route_renders_successfully_without_seeded_plans(): void
    {
        SubscriptionPlan::query()->delete();

        $response = $this->get('/register');

        $response->assertOk();
    }

    /**
     * Test successful login and redirect to dashboard.
     */
    public function test_user_can_login_successfully(): void
    {
        $user = User::factory()->create([
            'email' => 'teacher@example.com',
            'password' => 'SecurePass123!@#',
        ]);

        $response = $this->post('/login', [
            'email' => 'teacher@example.com',
            'password' => 'SecurePass123!@#',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect('/dashboard');
    }

    /**
     * Test new school registration journey (Journey A) and redirect.
     */
    public function test_school_registration_creates_organization_and_redirects_to_dashboard(): void
    {
        $response = $this->post('/register/school', [
            'name' => 'Dr. Jane Smith',
            'email' => 'jane.smith@academynetwork.org',
            'password' => 'SecurePassword123!@#',
            'password_confirmation' => 'SecurePassword123!@#',
            'school_name' => 'Starlight Global Academy',
            'subdomain' => 'starlight-global',
            'plan' => 'silver',
            'organization_type' => 'school',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'jane.smith@academynetwork.org']);
        $this->assertDatabaseHas('organizations', ['slug' => 'starlight-global']);

        // Redirects to dashboard cleanly without invalid external subdomain loops
        $response->assertRedirect('/dashboard');
    }

    /**
     * Test individual learner registration journey (Journey C) and redirect.
     */
    public function test_learner_registration_creates_account_and_redirects_to_dashboard(): void
    {
        $response = $this->post('/register/learner', [
            'name' => 'Alex Johnson',
            'email' => 'alex.learner@example.com',
            'password' => 'LearnerPass123!@#',
            'password_confirmation' => 'LearnerPass123!@#',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'alex.learner@example.com',
            'role' => 'learner',
        ]);

        $response->assertRedirect('/dashboard');
    }

    /**
     * Test invited member join registration journey (Journey B).
     */
    public function test_invitation_join_registration_attaches_to_organization(): void
    {
        $org = Organization::create([
            'name' => 'Oakridge High',
            'slug' => 'oakridge-high',
            'organization_type' => 'school',
            'email' => 'admin@oakridge.edu',
            'timezone' => 'UTC',
            'status' => 'active',
        ]);

        $inviter = User::factory()->create();

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'invited_by' => $inviter->id,
            'email' => 'faculty.new@oakridge.edu',
            'role' => 'teacher',
            'token' => 'valid-invitation-token-1234567890',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->post('/register/join', [
            'invitation_token' => $invitation->token,
            'name' => 'Professor David',
            'email' => 'faculty.new@oakridge.edu',
            'password' => 'FacultyPass123!@#',
            'password_confirmation' => 'FacultyPass123!@#',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['email' => 'faculty.new@oakridge.edu']);
        $this->assertDatabaseHas('organization_user', [
            'organization_id' => $org->id,
            'role' => 'teacher',
        ]);

        $response->assertRedirect('/dashboard');
    }

    /**
     * Test Passkeys relying_party_id resolution is always a non-null string.
     */
    public function test_passkeys_relying_party_id_is_always_valid_string(): void
    {
        $rpId = Passkeys::relyingPartyId();

        $this->assertIsString($rpId);
        $this->assertNotEmpty($rpId);
    }
}
