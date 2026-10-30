<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RegistrationJourneysAndPublicPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_render_successfully(): void
    {
        $this->get('/')->assertOk();
        $this->get('/benefits')->assertOk();
        $this->get('/how-it-works')->assertOk();
        $this->get('/about')->assertOk();
        $this->get('/contact')->assertOk();
        $this->get('/courses')->assertOk();
        $this->get('/register')->assertOk();
        $this->get('/login')->assertOk();
    }

    public function test_contact_form_submission_stores_message_and_redirects(): void
    {
        $payload = [
            'name' => 'Sarah Connor',
            'email' => 'sarah@skynet-research.edu',
            'subject' => 'Enterprise School Deployment',
            'message' => 'We are looking to onboard 1,500 students across 3 campus branches.',
        ];

        $response = $this->from('/contact')->post('/contact', $payload);

        $response->assertRedirect('/contact');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('contact_messages', [
            'name' => 'Sarah Connor',
            'email' => 'sarah@skynet-research.edu',
            'subject' => 'Enterprise School Deployment',
            'status' => 'unread',
        ]);
    }

    public function test_contact_form_validates_required_fields(): void
    {
        $response = $this->post('/contact', [
            'name' => '',
            'email' => 'not-an-email',
            'subject' => '',
            'message' => '',
        ]);

        $response->assertSessionHasErrors(['name', 'email', 'subject', 'message']);
    }

    public function test_journey_a_create_school_creates_user_and_organization_with_owner_role(): void
    {
        $response = $this->post('/register/school', [
            'name' => 'Dr. Robert Oppenheimer',
            'email' => 'robert@manhattan-academy.org',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
            'school_name' => 'Manhattan Science Academy',
            'organization_type' => 'academy',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $user = User::where('email', 'robert@manhattan-academy.org')->first();
        $this->assertNotNull($user);

        $org = Organization::where('created_by', $user->id)->first();
        $this->assertNotNull($org);
        $this->assertEquals('Manhattan Science Academy', $org->name);
        $this->assertEquals('academy', $org->organization_type);

        $membership = OrganizationUser::where('organization_id', $org->id)
            ->where('user_id', $user->id)
            ->first();

        $this->assertNotNull($membership);
        $this->assertEquals('owner', $membership->role);
        $this->assertEquals('active', $membership->status);

        // Verify default academic year was initialized
        $this->assertDatabaseHas('academic_years', [
            'organization_id' => $org->id,
            'is_current' => true,
        ]);

        // After email verification, dashboard renders successfully
        $user->markEmailAsVerified();
        $dashboardResponse = $this->actingAs($user)->get('/dashboard');
        $dashboardResponse->assertOk();
    }

    public function test_journey_b_join_existing_school_via_valid_invitation(): void
    {
        $schoolOwner = User::factory()->create();
        $org = Organization::create([
            'name' => 'Cambridge Institute',
            'slug' => 'cambridge-inst-'.Str::random(5),
            'organization_type' => 'institute',
            'status' => 'active',
            'created_by' => $schoolOwner->id,
        ]);

        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'teacher.alice@cambridge.org',
            'role' => 'teacher',
            'token' => 'INVITE_SECRET_TOKEN_999',
            'invited_by' => $schoolOwner->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->post('/register/join', [
            'token' => 'INVITE_SECRET_TOKEN_999',
            'name' => 'Alice Teacher',
            'email' => 'teacher.alice@cambridge.org',
            'password' => 'TeachingSecure2026!',
            'password_confirmation' => 'TeachingSecure2026!',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $newUser = User::where('email', 'teacher.alice@cambridge.org')->first();
        $this->assertNotNull($newUser);

        $membership = OrganizationUser::where('organization_id', $org->id)
            ->where('user_id', $newUser->id)
            ->first();

        $this->assertNotNull($membership);
        $this->assertEquals('teacher', $membership->role);
        $this->assertEquals('active', $membership->status);

        $invitation->refresh();
        $this->assertNotNull($invitation->accepted_at);

        // After email verification, teacher dashboard renders successfully
        $newUser->markEmailAsVerified();
        $dashboardResponse = $this->actingAs($newUser)->get('/dashboard');
        $dashboardResponse->assertOk();
    }

    public function test_journey_b_join_fails_with_invalid_or_expired_token(): void
    {
        $response = $this->post('/register/join', [
            'token' => 'NON_EXISTENT_TOKEN',
            'name' => 'Impostor',
            'email' => 'hacker@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors(['token']);
    }

    public function test_journey_c_individual_learner_registration(): void
    {
        $response = $this->post('/register/learner', [
            'name' => 'David Online Learner',
            'email' => 'david.learner@gmail.com',
            'password' => 'LearnerPass2026!',
            'password_confirmation' => 'LearnerPass2026!',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticated();

        $user = User::where('email', 'david.learner@gmail.com')->first();
        $this->assertNotNull($user);

        // Individual learner should NOT have any organization memberships
        $membershipCount = OrganizationUser::where('user_id', $user->id)->count();
        $this->assertEquals(0, $membershipCount);

        // Registered learner is automatically verified for immediate access
        $this->assertNotNull($user->email_verified_at);

        // Accessing /dashboard renders successfully
        $dashboardResponse = $this->actingAs($user)->get('/dashboard');
        $dashboardResponse->assertOk();
    }

    public function test_instant_verification_route_verifies_user_and_redirects(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->actingAs($user)->get('/email/verify-instant');

        $response->assertRedirect('/dashboard');
        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
