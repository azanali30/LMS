<?php

namespace Tests\Feature;

use App\Mail\OrganizationInvitationMail;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrganizationSwitcherAndInvitationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_another_organization_and_becomes_owner(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        // First Organization
        $org1 = Organization::create([
            'name' => 'First School',
            'slug' => 'first-school-'.strtolower(Str::random(5)),
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

        // Create second organization under their own account
        $newOrgSlug = 'second-academy-'.strtolower(Str::random(5));
        $response = $this->actingAs($user)->post(route('organizations.store'), [
            'name' => 'Second Academy',
            'slug' => $newOrgSlug,
            'organization_type' => 'academy',
            'email' => 'contact@secondacademy.com',
            'timezone' => 'UTC',
        ]);

        $response->assertRedirect(route('dashboard'));
        $response->assertSessionHas('success');

        $org2 = Organization::where('slug', $newOrgSlug)->first();
        $this->assertNotNull($org2);
        $this->assertEquals('Second Academy', $org2->name);

        // Assert user is associated with org2 as Owner
        $membership = OrganizationUser::where('organization_id', $org2->id)
            ->where('user_id', $user->id)
            ->first();
        $this->assertNotNull($membership);
        $this->assertEquals('owner', $membership->role);
        $this->assertEquals('active', $membership->status);

        // Assert session updated to new organization
        $this->assertEquals($org2->id, session('current_organization_id'));
    }

    public function test_teacher_student_parent_cannot_create_organizations(): void
    {
        $org = Organization::create([
            'name' => 'Demo School',
            'slug' => 'demo-school-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
        ]);

        foreach (['teacher', 'student', 'parent'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            OrganizationUser::create([
                'organization_id' => $org->id,
                'user_id' => $user->id,
                'role' => $role,
                'status' => 'active',
            ]);

            // Attempt GET create
            $this->actingAs($user)
                ->withSession(['current_organization_id' => $org->id])
                ->get(route('organizations.create'))
                ->assertForbidden();

            // Attempt POST store
            $this->actingAs($user)
                ->withSession(['current_organization_id' => $org->id])
                ->post(route('organizations.store'), [
                    'name' => "Rogue Org {$role}",
                    'slug' => "rogue-org-{$role}-".strtolower(Str::random(5)),
                    'organization_type' => 'academy',
                ])
                ->assertForbidden();
        }
    }

    public function test_super_admin_can_create_organization(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $slug = 'super-org-'.strtolower(Str::random(5));
        $response = $this->actingAs($superAdmin)
            ->post(route('organizations.store'), [
                'name' => 'Super Admin Org',
                'slug' => $slug,
                'organization_type' => 'academy',
            ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertDatabaseHas('organizations', ['slug' => $slug]);
    }

    public function test_user_can_switch_between_their_active_organizations(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        $orgA = Organization::create([
            'name' => 'Org Alpha',
            'slug' => 'org-alpha-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $orgA->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $orgB = Organization::create([
            'name' => 'Org Beta',
            'slug' => 'org-beta-'.strtolower(Str::random(5)),
            'organization_type' => 'academy',
            'status' => 'active',
            'created_by' => $user->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $orgB->id,
            'user_id' => $user->id,
            'role' => 'teacher',
            'status' => 'active',
        ]);

        // Switch to Org B
        $response = $this->actingAs($user)->post(route('organizations.switch', $orgB));
        $response->assertRedirect(route('dashboard'));
        $response->assertSessionHas('success', 'Switched to Org Beta.');
        $this->assertEquals($orgB->id, session('current_organization_id'));

        // Switch back to Org A
        $response = $this->actingAs($user)->post(route('organizations.switch', $orgA));
        $response->assertRedirect(route('dashboard'));
        $response->assertSessionHas('success', 'Switched to Org Alpha.');
        $this->assertEquals($orgA->id, session('current_organization_id'));
    }

    public function test_user_cannot_switch_to_organization_without_active_membership(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        $orgA = Organization::create([
            'name' => 'Org Alpha',
            'slug' => 'org-alpha-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $orgA->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        // Org B where user has NO membership
        $otherUser = User::factory()->create();
        $orgB = Organization::create([
            'name' => 'Org Beta',
            'slug' => 'org-beta-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $otherUser->id,
        ]);

        $response = $this->actingAs($user)->post(route('organizations.switch', $orgB));
        $response->assertStatus(403);
    }

    public function test_user_cannot_switch_to_organization_where_membership_is_inactive(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        $org = Organization::create([
            'name' => 'Suspended Org Membership',
            'slug' => 'suspended-org-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'student',
            'status' => 'suspended', // Inactive membership!
        ]);

        $response = $this->actingAs($user)->post(route('organizations.switch', $org));
        $response->assertStatus(403);
    }

    public function test_inactive_organization_cannot_be_switched_to(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        $org = Organization::create([
            'name' => 'Inactive Org',
            'slug' => 'inactive-org-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'suspended', // Inactive org status!
            'created_by' => $user->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->post(route('organizations.switch', $org));
        $response->assertStatus(403);
    }

    public function test_owner_can_send_invitation_and_email_is_dispatched(): void
    {
        Mail::fake();

        $user = User::factory()->create(['role' => 'student']);
        $org = Organization::create([
            'name' => 'Horizon Academy',
            'slug' => 'horizon-'.strtolower(Str::random(5)),
            'organization_type' => 'academy',
            'status' => 'active',
            'created_by' => $user->id,
        ]);
        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)
            ->withSession(['current_organization_id' => $org->id])
            ->post(route('organizations.invite'), [
                'email' => 'newteacher@horizon.edu',
                'role' => 'teacher',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $invitation = OrganizationInvitation::where('email', 'newteacher@horizon.edu')
            ->where('organization_id', $org->id)
            ->first();

        $this->assertNotNull($invitation);
        $this->assertEquals('teacher', $invitation->role);
        $this->assertEquals(40, strlen($invitation->token));
        $this->assertNull($invitation->accepted_at);
        $this->assertTrue($invitation->expires_at->isFuture());

        Mail::assertSent(OrganizationInvitationMail::class, function ($mail) use ($invitation) {
            return $mail->invitation->id === $invitation->id
                && $mail->hasTo('newteacher@horizon.edu');
        });
    }

    public function test_guest_visiting_invitation_is_guided_to_register(): void
    {
        $creator = User::factory()->create();
        $org = Organization::create([
            'name' => 'Gateway School',
            'slug' => 'gateway-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $creator->id,
        ]);
        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'newuser@example.com',
            'role' => 'student',
            'token' => Str::random(40),
            'invited_by' => $creator->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->get(route('invitations.accept', ['token' => $invitation->token]));

        $response->assertRedirect(route('register', ['journey' => 'join', 'token' => $invitation->token]));
        $this->assertEquals($invitation->token, session('pending_invitation_token'));
    }

    public function test_guest_with_existing_account_visiting_invitation_is_guided_to_login(): void
    {
        $creator = User::factory()->create();
        User::factory()->create(['email' => 'existing@example.com']);
        $org = Organization::create([
            'name' => 'Gateway School',
            'slug' => 'gateway-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $creator->id,
        ]);
        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'existing@example.com',
            'role' => 'teacher',
            'token' => Str::random(40),
            'invited_by' => $creator->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->get(route('invitations.accept', ['token' => $invitation->token]));

        $response->assertRedirect(route('login', ['email' => 'existing@example.com']));
        $this->assertEquals($invitation->token, session('pending_invitation_token'));
    }

    public function test_logged_in_user_with_matching_email_accepts_invitation_instantly(): void
    {
        $creator = User::factory()->create();
        $user = User::factory()->create(['email' => 'teacher@example.com']);
        $org = Organization::create([
            'name' => 'Stellar High',
            'slug' => 'stellar-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $creator->id,
        ]);
        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'teacher@example.com',
            'role' => 'teacher',
            'token' => Str::random(40),
            'invited_by' => $creator->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($user)->get(route('invitations.accept', ['token' => $invitation->token]));

        $response->assertRedirect(route('dashboard'));
        $response->assertSessionHas('success');

        // Verify membership created
        $membership = OrganizationUser::where('organization_id', $org->id)
            ->where('user_id', $user->id)
            ->first();
        $this->assertNotNull($membership);
        $this->assertEquals('teacher', $membership->role);
        $this->assertEquals('active', $membership->status);

        // Verify invitation marked accepted
        $invitation->refresh();
        $this->assertNotNull($invitation->accepted_at);

        // Verify active organization session
        $this->assertEquals($org->id, session('current_organization_id'));
    }

    public function test_logged_in_user_with_different_email_cannot_accept_invitation(): void
    {
        $creator = User::factory()->create();
        $user = User::factory()->create(['email' => 'wronguser@example.com']);
        $org = Organization::create([
            'name' => 'Stellar High',
            'slug' => 'stellar-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $creator->id,
        ]);
        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'intendedrecipient@example.com',
            'role' => 'admin',
            'token' => Str::random(40),
            'invited_by' => $creator->id,
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($user)->get(route('invitations.accept', ['token' => $invitation->token]));

        $response->assertRedirect(route('dashboard'));
        $response->assertSessionHas('error');

        // Verify membership was NOT created
        $this->assertFalse(
            OrganizationUser::where('organization_id', $org->id)
                ->where('user_id', $user->id)
                ->exists()
        );

        // Verify invitation was NOT accepted
        $invitation->refresh();
        $this->assertNull($invitation->accepted_at);
    }

    public function test_expired_invitation_cannot_be_accepted(): void
    {
        $creator = User::factory()->create();
        $org = Organization::create([
            'name' => 'Expired Org',
            'slug' => 'expired-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $creator->id,
        ]);
        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'user@example.com',
            'role' => 'student',
            'token' => Str::random(40),
            'invited_by' => $creator->id,
            'expires_at' => now()->subDay(), // Expired yesterday
        ]);

        $response = $this->get(route('invitations.accept', ['token' => $invitation->token]));

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('error', 'This invitation has expired. Please request a new invitation from your institution administrator.');
    }

    public function test_already_accepted_invitation_cannot_be_reused(): void
    {
        $creator = User::factory()->create();
        $org = Organization::create([
            'name' => 'Accepted Org',
            'slug' => 'accepted-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $creator->id,
        ]);
        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'user@example.com',
            'role' => 'student',
            'token' => Str::random(40),
            'invited_by' => $creator->id,
            'expires_at' => now()->addDays(5),
            'accepted_at' => now()->subHour(), // Already accepted
        ]);

        $response = $this->get(route('invitations.accept', ['token' => $invitation->token]));

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('error', 'This invitation has already been accepted.');
    }

    public function test_joining_via_register_join_validates_matching_email(): void
    {
        $creator = User::factory()->create();
        $org = Organization::create([
            'name' => 'Strict School',
            'slug' => 'strict-'.strtolower(Str::random(5)),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $creator->id,
        ]);
        $invitation = OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => 'correctemail@example.com',
            'role' => 'student',
            'token' => Str::random(40),
            'invited_by' => $creator->id,
            'expires_at' => now()->addDays(5),
        ]);

        // Attempting to register with mismatched email
        $response = $this->post(route('register.join'), [
            'invitation_token' => $invitation->token,
            'name' => 'Attacker',
            'email' => 'tamperedemail@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertSessionHasErrors(['email']);
    }
}
