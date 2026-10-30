<?php

namespace Tests\Feature;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SchoolManagementAndLearningTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;
    private User $owner;
    private User $teacher;
    private User $student;
    private AcademicYear $academicYear;
    private AcademicTerm $academicTerm;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['name' => 'Principal Vance', 'role' => 'student']);
        $this->teacher = User::factory()->create(['name' => 'Prof. Clark', 'role' => 'student']);
        $this->student = User::factory()->create(['name' => 'Alex Turner', 'role' => 'student']);

        $this->org = Organization::create([
            'name' => 'Crestwood High',
            'slug' => 'crestwood-'.Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $this->owner->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $this->org->id,
            'user_id' => $this->owner->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        OrganizationUser::create([
            'organization_id' => $this->org->id,
            'user_id' => $this->teacher->id,
            'role' => 'teacher',
            'status' => 'active',
        ]);

        OrganizationUser::create([
            'organization_id' => $this->org->id,
            'user_id' => $this->student->id,
            'role' => 'student',
            'status' => 'active',
        ]);

        $this->academicYear = AcademicYear::create([
            'organization_id' => $this->org->id,
            'name' => '2026-2027 Session',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
        ]);

        $this->academicTerm = AcademicTerm::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Fall Term',
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-15',
            'is_current' => true,
        ]);
    }

    public function test_owner_can_create_class_and_section(): void
    {
        $response = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/classes', [
                'name' => 'Grade 11',
                'code' => 'G11',
                'default_section' => 'Section Blue',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('school_classes', [
            'organization_id' => $this->org->id,
            'name' => 'Grade 11',
            'code' => 'G11',
        ]);
        $this->assertDatabaseHas('class_sections', [
            'organization_id' => $this->org->id,
            'name' => 'Section Blue',
        ]);
    }

    public function test_student_cannot_create_classes(): void
    {
        $response = $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/classes', [
                'name' => 'Hacker Class',
            ]);

        $response->assertForbidden();
    }

    public function test_teacher_cannot_create_or_modify_classes_and_sections(): void
    {
        $class = SchoolClass::create(['organization_id' => $this->org->id, 'name' => 'Existing Class']);
        $section = ClassSection::create(['organization_id' => $this->org->id, 'school_class_id' => $class->id, 'name' => 'Existing Section']);

        // Teacher cannot create class
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/classes', ['name' => 'Unauthorized Class'])
            ->assertForbidden();

        // Teacher cannot create section
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/classes/{$class->id}/sections", ['name' => 'Unauthorized Section'])
            ->assertForbidden();

        // Teacher cannot create direct section
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/sections', ['name' => 'Direct Section', 'school_class_id' => $class->id])
            ->assertForbidden();

        // Teacher cannot update class
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->put("/school/classes/{$class->id}", ['name' => 'Renamed Class'])
            ->assertForbidden();

        // Teacher cannot delete class
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->delete("/school/classes/{$class->id}")
            ->assertForbidden();

        // Teacher cannot update section
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->put("/school/sections/{$section->id}", [
                'school_class_id' => $class->id,
                'name' => 'Renamed Section',
            ])
            ->assertForbidden();

        // Teacher cannot delete section
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->delete("/school/sections/{$section->id}")
            ->assertForbidden();
    }

    public function test_admin_can_manage_classes_and_sections(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        \App\Models\OrganizationUser::create([
            'organization_id' => $this->org->id,
            'user_id' => $admin->id,
            'role' => 'admin',
            'status' => 'active',
        ]);

        $createResponse = $this->actingAs($admin)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/classes', [
                'name' => 'Admin Class',
                'code' => 'AC-101',
                'default_section' => 'Admin Section A',
            ]);

        $createResponse->assertRedirect();
        $this->assertDatabaseHas('school_classes', [
            'organization_id' => $this->org->id,
            'name' => 'Admin Class',
        ]);
    }

    public function test_admin_can_enroll_student_in_class_section(): void
    {
        $class = SchoolClass::create([
            'organization_id' => $this->org->id,
            'name' => 'Grade 10',
        ]);

        $section = ClassSection::create([
            'organization_id' => $this->org->id,
            'school_class_id' => $class->id,
            'name' => 'Section A',
            'capacity' => 30,
        ]);

        $response = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/students', [
                'name' => 'New Pupil',
                'email' => 'pupil@crestwood.edu',
                'class_section_id' => $section->id,
                'roll_number' => 'CW-101',
                'academic_year_id' => $this->academicYear->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'pupil@crestwood.edu']);
        $this->assertDatabaseHas('student_enrollments', [
            'organization_id' => $this->org->id,
            'class_section_id' => $section->id,
            'roll_number' => 'CW-101',
        ]);
    }

    public function test_teacher_can_record_daily_attendance(): void
    {
        $class = SchoolClass::create(['organization_id' => $this->org->id, 'name' => 'Grade 9']);
        $section = ClassSection::create(['organization_id' => $this->org->id, 'school_class_id' => $class->id, 'name' => 'Section 1']);
        $subject = Subject::create(['organization_id' => $this->org->id, 'name' => 'General Science', 'code' => 'SCI-9']);

        ClassSubjectTeacher::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'class_section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $this->teacher->id,
        ]);

        $response = $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $section->id,
                'date' => '2026-10-25',
                'attendances' => [
                    [
                        'student_id' => $this->student->id,
                        'status' => 'present',
                        'remarks' => 'On time',
                    ],
                ],
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('attendances', [
            'organization_id' => $this->org->id,
            'class_section_id' => $section->id,
            'student_id' => $this->student->id,
            'status' => 'present',
            'remarks' => 'On time',
        ]);
    }

    public function test_teacher_can_create_assessment_and_grade_student(): void
    {
        $class = SchoolClass::create(['organization_id' => $this->org->id, 'name' => 'Grade 12']);
        $section = ClassSection::create(['organization_id' => $this->org->id, 'school_class_id' => $class->id, 'name' => 'Section Honors']);
        $subject = Subject::create(['organization_id' => $this->org->id, 'name' => 'AP Biology', 'code' => 'BIO-AP']);

        ClassSubjectTeacher::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'class_section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $this->teacher->id,
        ]);

        // 1. Create Assessment
        $response = $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/grades/assessments', [
                'title' => 'Genetics Exam',
                'type' => 'exam',
                'class_section_id' => $section->id,
                'subject_id' => $subject->id,
                'academic_term_id' => $this->academicTerm->id,
                'max_score' => 100,
                'due_date' => '2026-11-01',
            ]);

        $response->assertRedirect();
        $assessment = Assessment::where('organization_id', $this->org->id)->first();
        $this->assertNotNull($assessment);

        // 2. Grade Student
        $gradeResponse = $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/grades/{$assessment->id}", [
                'grades' => [
                    [
                        'student_id' => $this->student->id,
                        'score' => 94.5,
                        'feedback' => 'Superb analysis of Mendelian genetics.',
                    ],
                ],
            ]);

        $gradeResponse->assertRedirect();
        $this->assertDatabaseHas('grades', [
            'organization_id' => $this->org->id,
            'assessment_id' => $assessment->id,
            'student_id' => $this->student->id,
            'score' => 94.5,
        ]);
    }

    public function test_online_course_enrollment_and_certificate_completion(): void
    {
        // 1. Create Course, Module, and 1 Lesson
        $course = Course::create([
            'organization_id' => $this->org->id,
            'instructor_id' => $this->teacher->id,
            'title' => 'Quantum Computing Basics',
            'slug' => 'quantum-computing-basics-'.Str::random(5),
            'level' => 'intermediate',
            'summary' => 'Introduction to qubits and quantum gates.',
            'is_published' => true,
            'is_public' => false,
        ]);

        $module = CourseModule::create([
            'organization_id' => $this->org->id,
            'course_id' => $course->id,
            'title' => 'Module 1: The Qubit',
            'order' => 1,
        ]);

        $lesson = Lesson::create([
            'organization_id' => $this->org->id,
            'course_module_id' => $module->id,
            'title' => 'Superposition and Entanglement',
            'slug' => 'superposition-and-entanglement',
            'type' => 'video',
            'duration_minutes' => 30,
            'order' => 1,
        ]);

        // 2. Student enrolls in Course
        $enrollResponse = $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/learning/courses/{$course->id}/enroll");

        $enrollResponse->assertRedirect();
        $this->assertDatabaseHas('course_enrollments', [
            'organization_id' => $this->org->id,
            'course_id' => $course->id,
            'user_id' => $this->student->id,
        ]);

        // 3. Student completes the only lesson (100% progress)
        $completeResponse = $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/learning/courses/{$course->id}/lessons/{$lesson->id}/complete");

        $completeResponse->assertRedirect();

        // 4. Verify LessonCompletion, 100% Progress, and Auto-Generated Certificate
        $this->assertDatabaseHas('lesson_completions', [
            'organization_id' => $this->org->id,
            'course_id' => $course->id,
            'lesson_id' => $lesson->id,
            'user_id' => $this->student->id,
        ]);

        $this->assertDatabaseHas('course_enrollments', [
            'course_id' => $course->id,
            'user_id' => $this->student->id,
            'progress_percent' => 100,
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('course_certificates', [
            'organization_id' => $this->org->id,
            'course_id' => $course->id,
            'user_id' => $this->student->id,
        ]);
    }

    public function test_student_cannot_access_classes_or_sections_directory_directly(): void
    {
        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/classes')
            ->assertForbidden();

        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/sections')
            ->assertForbidden();
    }

    public function test_student_views_my_attendance_and_cannot_post_attendance(): void
    {
        $class = SchoolClass::create(['organization_id' => $this->org->id, 'name' => 'Grade 10']);
        $section = ClassSection::create(['organization_id' => $this->org->id, 'school_class_id' => $class->id, 'name' => 'Section A']);

        // Student can view My Attendance
        $response = $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/attendance');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('school/attendance')
            ->where('isStudent', true)
        );

        // Student cannot submit attendance
        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $section->id,
                'date' => '2026-10-26',
                'attendances' => [
                    ['student_id' => $this->student->id, 'status' => 'present'],
                ],
            ])
            ->assertForbidden();
    }

    public function test_student_views_own_grades_and_cannot_create_assessments_or_grade(): void
    {
        $class = SchoolClass::create(['organization_id' => $this->org->id, 'name' => 'Grade 10']);
        $section = ClassSection::create(['organization_id' => $this->org->id, 'school_class_id' => $class->id, 'name' => 'Section A']);
        $subject = Subject::create(['organization_id' => $this->org->id, 'name' => 'Physics', 'code' => 'PHY']);
        $term = AcademicTerm::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Term 1',
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
        ]);

        $assessment = Assessment::create([
            'organization_id' => $this->org->id,
            'title' => 'Mechanics Exam',
            'type' => 'exam',
            'class_section_id' => $section->id,
            'subject_id' => $subject->id,
            'academic_term_id' => $term->id,
            'max_score' => 100,
        ]);

        // Student can view Grades (sees isStudent: true, canManage: false)
        $response = $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/grades');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('school/grades')
            ->where('isStudent', true)
            ->where('canManage', false)
        );

        // Student cannot create assessment
        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/grades/assessments', [
                'title' => 'Hacker Exam',
                'type' => 'exam',
                'class_section_id' => $section->id,
                'subject_id' => $subject->id,
                'academic_term_id' => $term->id,
                'max_score' => 100,
            ])
            ->assertForbidden();

        // Student cannot record grades
        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/grades/{$assessment->id}", [
                'grades' => [
                    ['student_id' => $this->student->id, 'score' => 100],
                ],
            ])
            ->assertForbidden();
    }

    public function test_student_cannot_create_courses(): void
    {
        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/learning/courses', [
                'title' => 'Unauthorized Course',
                'level' => 'beginner',
                'summary' => 'Hacking LMS',
            ])
            ->assertForbidden();
    }
}
