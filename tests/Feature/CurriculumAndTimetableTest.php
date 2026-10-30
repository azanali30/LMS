<?php

namespace Tests\Feature;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\Curriculum;
use App\Models\CurriculumTopic;
use App\Models\CurriculumTopicProgress;
use App\Models\CurriculumUnit;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\TimetableEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CurriculumAndTimetableTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;
    private User $owner;
    private User $teacher;
    private User $student;
    private AcademicYear $academicYear;
    private SchoolClass $class10;
    private SchoolClass $class9;
    private ClassSection $section10A;
    private ClassSection $section9A;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['name' => 'Principal Vance', 'role' => 'student']);
        $this->teacher = User::factory()->create(['name' => 'Prof. Clark', 'role' => 'student']);
        $this->student = User::factory()->create(['name' => 'Alex Turner', 'role' => 'student']);

        $this->org = Organization::create([
            'name' => 'Crestwood High',
            'slug' => 'crestwood-' . Str::random(5),
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

        $this->class10 = SchoolClass::create([
            'organization_id' => $this->org->id,
            'name' => 'Grade 10',
            'code' => 'G10',
        ]);

        $this->section10A = ClassSection::create([
            'organization_id' => $this->org->id,
            'school_class_id' => $this->class10->id,
            'name' => 'Section A',
            'room' => 'Room 101',
        ]);

        $this->class9 = SchoolClass::create([
            'organization_id' => $this->org->id,
            'name' => 'Grade 9',
            'code' => 'G9',
        ]);

        $this->section9A = ClassSection::create([
            'organization_id' => $this->org->id,
            'school_class_id' => $this->class9->id,
            'name' => 'Section A',
            'room' => 'Room 91',
        ]);
    }

    public function test_owner_can_create_subject_for_a_class(): void
    {
        $response = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/subjects', [
                'name' => 'Computer Science',
                'code' => 'CS-101',
                'description' => 'Programming and Computational Thinking',
                'type' => 'core',
                'school_class_id' => $this->class10->id,
                'academic_year_id' => $this->academicYear->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('subjects', [
            'organization_id' => $this->org->id,
            'name' => 'Computer Science',
            'code' => 'CS-101',
            'school_class_id' => $this->class10->id,
            'type' => 'core',
        ]);
    }

    public function test_unauthorized_student_cannot_create_or_modify_subject(): void
    {
        $subject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Physics',
            'code' => 'PHY',
            'school_class_id' => $this->class10->id,
        ]);

        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/subjects', [
                'name' => 'Hacker Subject',
            ])
            ->assertForbidden();

        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->put("/school/subjects/{$subject->id}", [
                'name' => 'Defaced Physics',
            ])
            ->assertForbidden();

        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->delete("/school/subjects/{$subject->id}")
            ->assertForbidden();
    }

    public function test_teacher_can_be_assigned_to_subject_and_unassigned(): void
    {
        $subject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Mathematics',
            'code' => 'MATH-10',
            'school_class_id' => $this->class10->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/subjects/assign-teacher', [
                'subject_id' => $subject->id,
                'class_section_id' => $this->section10A->id,
                'teacher_id' => $this->teacher->id,
                'academic_year_id' => $this->academicYear->id,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('class_subject_teachers', [
            'organization_id' => $this->org->id,
            'subject_id' => $subject->id,
            'class_section_id' => $this->section10A->id,
            'teacher_id' => $this->teacher->id,
        ]);

        $assignment = ClassSubjectTeacher::where('subject_id', $subject->id)->first();
        $this->assertNotNull($assignment);

        // Remove assignment
        $deleteResp = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->delete("/school/subjects/assignments/{$assignment->id}");

        $deleteResp->assertRedirect();
        $this->assertDatabaseMissing('class_subject_teachers', ['id' => $assignment->id]);
    }

    public function test_teacher_cannot_be_selected_from_another_organization(): void
    {
        $otherOrg = Organization::create([
            'name' => 'Rival Academy',
            'slug' => 'rival-' . Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $this->owner->id,
        ]);

        $foreignTeacher = User::factory()->create(['name' => 'Foreign Teacher', 'role' => 'student']);
        OrganizationUser::create([
            'organization_id' => $otherOrg->id,
            'user_id' => $foreignTeacher->id,
            'role' => 'teacher',
            'status' => 'active',
        ]);

        $subject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Chemistry',
            'school_class_id' => $this->class10->id,
        ]);

        $response = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/subjects/assign-teacher', [
                'subject_id' => $subject->id,
                'class_section_id' => $this->section10A->id,
                'teacher_id' => $foreignTeacher->id,
                'academic_year_id' => $this->academicYear->id,
            ]);

        $response->assertSessionHasErrors('teacher_id');
        $this->assertDatabaseMissing('class_subject_teachers', [
            'teacher_id' => $foreignTeacher->id,
            'organization_id' => $this->org->id,
        ]);
    }

    public function test_students_see_only_subjects_for_their_enrolled_class(): void
    {
        // Subject 1 for Class 10
        $subject10 = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Class 10 Biology',
            'school_class_id' => $this->class10->id,
        ]);

        // Subject 2 for Class 9
        $subject9 = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Class 9 History',
            'school_class_id' => $this->class9->id,
        ]);

        // Enroll student into Class 10 Section A
        StudentEnrollment::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'class_section_id' => $this->section10A->id,
            'student_id' => $this->student->id,
            'roll_number' => '101',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/subjects');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('school/subjects')
            ->where('isStudent', true)
            ->has('studentSubjects', 1)
            ->where('studentSubjects.0.id', $subject10->id)
            ->where('studentSubjects.0.name', 'Class 10 Biology')
        );
    }

    public function test_curriculum_builder_lifecycle(): void
    {
        $subject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Computer Science',
            'school_class_id' => $this->class10->id,
        ]);

        // 1. Create curriculum
        $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/subjects/{$subject->id}/curriculum", [
                'title' => 'Grade 10 CS Syllabus',
                'description' => 'Comprehensive Programming Course',
                'status' => 'published',
            ])
            ->assertRedirect();

        $curriculum = Curriculum::where('subject_id', $subject->id)->first();
        $this->assertNotNull($curriculum);
        $this->assertEquals('published', $curriculum->status);

        // 2. Add Unit
        $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/curriculums/{$curriculum->id}/units", [
                'title' => 'Unit 1: Programming Fundamentals',
                'estimated_periods' => 8,
                'order' => 1,
            ])
            ->assertRedirect();

        $unit = CurriculumUnit::where('curriculum_id', $curriculum->id)->first();
        $this->assertNotNull($unit);

        // 3. Add Topic
        $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/curriculums/units/{$unit->id}/topics", [
                'title' => 'Topic 1.1: Variables and Data Types',
                'learning_objectives' => 'Understand integer, float, and string variables',
                'order' => 1,
                'status' => 'published',
            ])
            ->assertRedirect();

        $topic = CurriculumTopic::where('curriculum_unit_id', $unit->id)->first();
        $this->assertNotNull($topic);

        // 4. Teacher records lesson progress for section
        $this->actingAs($this->teacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/curriculums/topics/{$topic->id}/progress", [
                'class_section_id' => $this->section10A->id,
                'status' => 'completed',
                'notes' => 'Concluded with lab exercise 3',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('curriculum_topic_progress', [
            'curriculum_topic_id' => $topic->id,
            'class_section_id' => $this->section10A->id,
            'status' => 'completed',
        ]);
    }

    public function test_admin_can_schedule_period_and_conflicts_are_rejected(): void
    {
        $subject1 = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Math',
            'school_class_id' => $this->class10->id,
        ]);

        $subject2 = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'English',
            'school_class_id' => $this->class10->id,
        ]);

        // Schedule Period 1: Monday 08:30 to 09:15 in Room 101 with Teacher Clark
        $response = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/timetable', [
                'academic_year_id' => $this->academicYear->id,
                'school_class_id' => $this->class10->id,
                'class_section_id' => $this->section10A->id,
                'subject_id' => $subject1->id,
                'teacher_id' => $this->teacher->id,
                'day_of_week' => 'monday',
                'start_time' => '08:30',
                'end_time' => '09:15',
                'room' => 'Room 101',
                'is_published' => true,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('timetable_entries', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section10A->id,
            'day_of_week' => 'monday',
            'room' => 'Room 101',
        ]);

        // Conflict 1: Overlapping time for same section on Monday (08:45 to 09:30)
        $overlapResponse = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/timetable', [
                'academic_year_id' => $this->academicYear->id,
                'school_class_id' => $this->class10->id,
                'class_section_id' => $this->section10A->id,
                'subject_id' => $subject2->id,
                'day_of_week' => 'monday',
                'start_time' => '08:45',
                'end_time' => '09:30',
            ]);
        $overlapResponse->assertSessionHasErrors('start_time');

        // Conflict 2: Teacher double-booking (Teacher Clark scheduled for Section 9A at the same time: Monday 08:30-09:15)
        $teacherConflictResponse = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/timetable', [
                'academic_year_id' => $this->academicYear->id,
                'school_class_id' => $this->class9->id,
                'class_section_id' => $this->section9A->id,
                'subject_id' => $subject2->id,
                'teacher_id' => $this->teacher->id,
                'day_of_week' => 'monday',
                'start_time' => '08:30',
                'end_time' => '09:15',
            ]);
        $teacherConflictResponse->assertSessionHasErrors('teacher_id');

        // Conflict 3: Room double-booking (Room 101 booked for Section 9A at the same time)
        $roomConflictResponse = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/timetable', [
                'academic_year_id' => $this->academicYear->id,
                'school_class_id' => $this->class9->id,
                'class_section_id' => $this->section9A->id,
                'subject_id' => $subject2->id,
                'day_of_week' => 'monday',
                'start_time' => '08:30',
                'end_time' => '09:15',
                'room' => 'Room 101',
            ]);
        $roomConflictResponse->assertSessionHasErrors('room');
    }

    public function test_student_sees_only_own_section_timetable(): void
    {
        $subject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Math',
            'school_class_id' => $this->class10->id,
        ]);

        // Period in Section 10A (Student's section)
        $entry10A = TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $subject->id,
            'teacher_id' => $this->teacher->id,
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '09:45:00',
            'is_published' => true,
        ]);

        // Period in Section 9A (Different section)
        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class9->id,
            'class_section_id' => $this->section9A->id,
            'subject_id' => $subject->id,
            'day_of_week' => 'monday',
            'start_time' => '09:00:00',
            'end_time' => '09:45:00',
            'is_published' => true,
        ]);

        // Enroll student in Section 10A
        StudentEnrollment::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'class_section_id' => $this->section10A->id,
            'student_id' => $this->student->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/timetable');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('school/timetable')
            ->where('isStudent', true)
            ->has('entries', 1)
            ->where('entries.0.id', $entry10A->id)
        );
    }

    public function test_student_cannot_create_timetable_entries(): void
    {
        $subject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Math',
            'school_class_id' => $this->class10->id,
        ]);

        $this->actingAs($this->student)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/timetable', [
                'academic_year_id' => $this->academicYear->id,
                'school_class_id' => $this->class10->id,
                'class_section_id' => $this->section10A->id,
                'subject_id' => $subject->id,
                'day_of_week' => 'monday',
                'start_time' => '10:00',
                'end_time' => '10:45',
            ])
            ->assertForbidden();
    }
}
