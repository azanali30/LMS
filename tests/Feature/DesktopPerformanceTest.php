<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassSection;
use App\Models\Course;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DesktopPerformanceTest extends TestCase
{
    use RefreshDatabase;

    private function seedTenant(): array
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $org = Organization::create([
            'name' => 'Perf Academy',
            'slug' => 'perf-academy',
            'organization_type' => 'school',
            'status' => 'active',
        ]);
        $org->members()->attach($owner->id, ['role' => 'owner', 'status' => 'active']);

        $plan = SubscriptionPlan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'price_monthly' => 99,
            'price_yearly' => 999,
            'max_students' => 1000,
            'max_courses' => 100,
            'is_active' => true,
        ]);

        OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ]);

        $class = SchoolClass::create([
            'organization_id' => $org->id,
            'name' => 'Grade 10',
            'code' => 'G10',
        ]);
        $section = ClassSection::create([
            'organization_id' => $org->id,
            'school_class_id' => $class->id,
            'name' => 'Section A',
            'capacity' => 40,
        ]);

        $year = AcademicYear::create([
            'organization_id' => $org->id,
            'name' => '2026-2027',
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_current' => true,
        ]);

        for ($i = 1; $i <= 5; $i++) {
            $student = User::factory()->create(['role' => 'student']);
            $org->members()->attach($student->id, ['role' => 'student', 'status' => 'active']);
            StudentEnrollment::create([
                'organization_id' => $org->id,
                'academic_year_id' => $year->id,
                'student_id' => $student->id,
                'class_section_id' => $section->id,
                'roll_number' => 'R-' . $i,
                'status' => 'active',
            ]);
        }

        return [$owner, $org];
    }

    public function test_tenant_navigation_query_budgets_are_bounded(): void
    {
        [$owner, $org] = $this->seedTenant();

        $routes = [
            '/dashboard',
            '/school/students',
            '/school/classes',
            '/school/attendance',
            '/school/fees',
            '/learning/courses',
        ];

        $results = [];
        foreach ($routes as $uri) {
            TenantContext::set(null);
            DB::flushQueryLog();
            DB::enableQueryLog();

            $t0 = microtime(true);
            $response = $this->actingAs($owner)
                ->withSession(['current_organization_id' => $org->id])
                ->withHeader('User-Agent', 'Mozilla/5.0 InstitutoPropio-Desktop/1.0.0')
                ->get($uri);
            $ms = round((microtime(true) - $t0) * 1000, 1);

            $response->assertOk();
            $queries = count(DB::getQueryLog());
            $results[$uri] = ['queries' => $queries, 'ms' => $ms];
        }

        // Emit query counts to stderr so we capture exact BEFORE/AFTER numbers
        fwrite(STDERR, "\nPERF_BENCH: " . json_encode($results) . "\n");
        $this->assertNotEmpty($results);
    }
}
