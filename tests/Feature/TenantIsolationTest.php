<?php

namespace Tests\Feature;

use App\Models\ClassSection;
use App\Models\Course;
use App\Models\Organization;
use App\Models\OrganizationInvitation;
use App\Models\OrganizationUser;
use App\Models\SchoolClass;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_access_their_own_organization_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $orgA = Organization::create([
            'name' => 'Academy Alpha',
            'slug' => 'academy-alpha-'.Str::random(5),
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

        $response = $this->actingAs($user)->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_user_from_org_a_cannot_switch_to_org_b(): void
    {
        $userA = User::factory()->create(['role' => 'student']);
        $userB = User::factory()->create(['role' => 'student']);

        $orgA = Organization::create([
            'name' => 'Academy Alpha',
            'slug' => 'academy-alpha-'.Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $userA->id,
        ]);

        $orgB = Organization::create([
            'name' => 'Academy Beta',
            'slug' => 'academy-beta-'.Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $userB->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $orgA->id,
            'user_id' => $userA->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        OrganizationUser::create([
            'organization_id' => $orgB->id,
            'user_id' => $userB->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        // User A tries to switch to Org B
        $response = $this->actingAs($userA)->post(route('organizations.switch', $orgB));
        $response->assertForbidden();
    }

    public function test_tenant_scope_prevents_query_leaks_between_organizations(): void
    {
        $orgA = Organization::create([
            'name' => 'Org A',
            'slug' => 'org-a-'.Str::random(5),
            'organization_type' => 'school',
        ]);

        $orgB = Organization::create([
            'name' => 'Org B',
            'slug' => 'org-b-'.Str::random(5),
            'organization_type' => 'school',
        ]);

        // Create class in Org A
        $classA = SchoolClass::create([
            'organization_id' => $orgA->id,
            'name' => 'Org A Secret Class',
        ]);

        // Create class in Org B
        $classB = SchoolClass::create([
            'organization_id' => $orgB->id,
            'name' => 'Org B Class',
        ]);

        // When in Org A context
        TenantContext::set($orgA);
        $classesInContextA = SchoolClass::all();

        $this->assertTrue($classesInContextA->contains($classA));
        $this->assertFalse($classesInContextA->contains($classB));

        // When in Org B context
        TenantContext::set($orgB);
        $classesInContextB = SchoolClass::all();

        $this->assertTrue($classesInContextB->contains($classB));
        $this->assertFalse($classesInContextB->contains($classA));

        TenantContext::set(null);
    }

    public function test_student_cannot_create_classes_or_manage_academics(): void
    {
        $studentUser = User::factory()->create(['role' => 'student']);
        $org = Organization::create([
            'name' => 'Academy Gamma',
            'slug' => 'academy-gamma-'.Str::random(5),
            'organization_type' => 'school',
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $studentUser->id,
            'role' => 'student',
            'status' => 'active',
        ]);

        $this->actingAs($studentUser)->withSession(['current_organization_id' => $org->id]);

        $response = $this->post(route('school.classes.store'), [
            'name' => 'Malicious Class',
        ]);

        $response->assertForbidden();
    }

    public function test_invitation_can_be_sent_and_accepted(): void
    {
        $owner = User::factory()->create(['role' => 'student']);
        $invitedUser = User::factory()->create(['role' => 'student']);

        $org = Organization::create([
            'name' => 'Academy Delta',
            'slug' => 'academy-delta-'.Str::random(5),
            'organization_type' => 'school',
            'created_by' => $owner->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $token = 'invitation-secret-token-'.Str::random(20);

        OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => $invitedUser->email,
            'role' => 'teacher',
            'token' => $token,
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(7),
        ]);

        // Invited user accepts the token
        $response = $this->actingAs($invitedUser)->get(route('invitations.accept', $token));
        $response->assertRedirect(route('dashboard'));

        $this->assertTrue($invitedUser->hasRoleInOrganization($org->id, 'teacher'));
    }

    public function test_private_courses_are_restricted_to_organization_members(): void
    {
        $owner = User::factory()->create(['role' => 'student']);
        $outsider = User::factory()->create(['role' => 'student']);

        $org = Organization::create([
            'name' => 'Private Learning Org',
            'slug' => 'private-learning-'.Str::random(5),
            'organization_type' => 'school',
            'created_by' => $owner->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $privateCourse = Course::create([
            'organization_id' => $org->id,
            'instructor_id' => $owner->id,
            'title' => 'Top Secret Proprietary Course',
            'slug' => 'top-secret-'.Str::random(5),
            'level' => 'advanced',
            'summary' => 'Confidential syllabus',
            'is_published' => true,
            'is_public' => false, // private to org
        ]);

        // Outsider attempts to enroll
        $response = $this->actingAs($outsider)->post(route('courses.enroll', $privateCourse));
        $response->assertForbidden();
    }
}
