<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $org = \App\Models\Organization::create([
            'name' => 'Oakridge Academy',
            'slug' => 'oakridge-test-'.\Illuminate\Support\Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        \App\Models\OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_student_can_render_student_dashboard_without_errors(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $org = \App\Models\Organization::create([
            'name' => 'Edu Tech Academy',
            'slug' => 'edu-tech-'.\Illuminate\Support\Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $student->id,
        ]);

        \App\Models\OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $student->id,
            'role' => 'student',
            'status' => 'active',
        ]);

        $response = $this->actingAs($student)
            ->withSession(['current_organization_id' => $org->id])
            ->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->component('tenant/dashboard-student')
            ->has('feeSummary')
            ->where('feeSummary.currency', 'USD')
        );
    }
}
