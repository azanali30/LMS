<?php

namespace Tests\Feature;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Attendance;
use App\Models\AttendanceSubstitute;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\Grade;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\TimetableEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TeacherPortalAndAttendancePermissionsTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;
    private Organization $orgB;
    private User $owner;
    private User $admin;
    private User $teacher1;
    private User $teacher2;
    private User $substituteTeacher;
    private User $student1;
    private User $student2;
    private AcademicYear $academicYear;
    private AcademicTerm $academicTerm;
    private SchoolClass $class10;
    private SchoolClass $class9;
    private ClassSection $section10A;
    private ClassSection $section9A;
    private Subject $mathSubject;
    private Subject $englishSubject;

    protected function setUp(): void
    {
        parent::setUp();

        // Users
        $this->owner = User::factory()->create(['name' => 'Principal Vance', 'role' => 'student']);
        $this->admin = User::factory()->create(['name' => 'Dean Pelton', 'role' => 'student']);
        $this->teacher1 = User::factory()->create(['name' => 'Prof. Clark', 'role' => 'student']);
        $this->teacher2 = User::factory()->create(['name' => 'Prof. Smith', 'role' => 'student']);
        $this->substituteTeacher = User::factory()->create(['name' => 'Prof. Baker', 'role' => 'student']);
        $this->student1 = User::factory()->create(['name' => 'Alice Walker', 'role' => 'student']);
        $this->student2 = User::factory()->create(['name' => 'Bob Davis', 'role' => 'student']);

        // Primary Org
        $this->org = Organization::create([
            'name' => 'Apex International Academy',
            'slug' => 'apex-intl-'.Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $this->owner->id,
            'attendance_mode' => 'daily_first_period',
            'allow_attendance_editing' => true,
        ]);

        // Secondary Org for Tenant Isolation
        $this->orgB = Organization::create([
            'name' => 'Beacon High',
            'slug' => 'beacon-high-'.Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $this->owner->id,
            'attendance_mode' => 'daily_first_period',
            'allow_attendance_editing' => true,
        ]);

        // Memberships in Primary Org
        OrganizationUser::create(['organization_id' => $this->org->id, 'user_id' => $this->owner->id, 'role' => 'owner', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->org->id, 'user_id' => $this->admin->id, 'role' => 'admin', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->org->id, 'user_id' => $this->teacher1->id, 'role' => 'teacher', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->org->id, 'user_id' => $this->teacher2->id, 'role' => 'teacher', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->org->id, 'user_id' => $this->substituteTeacher->id, 'role' => 'teacher', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->org->id, 'user_id' => $this->student1->id, 'role' => 'student', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->org->id, 'user_id' => $this->student2->id, 'role' => 'student', 'status' => 'active']);

        // Academic Session
        $this->academicYear = AcademicYear::create([
            'organization_id' => $this->org->id,
            'name' => '2026-2027 Academic Year',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
        ]);

        $this->academicTerm = AcademicTerm::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'name' => 'Fall Term 2026',
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-20',
            'is_current' => true,
        ]);

        // Classes & Sections
        $this->class10 = SchoolClass::create(['organization_id' => $this->org->id, 'name' => 'Grade 10', 'code' => 'G10']);
        $this->section10A = ClassSection::create(['organization_id' => $this->org->id, 'school_class_id' => $this->class10->id, 'name' => 'Section 10-A', 'room' => 'Room 101']);

        $this->class9 = SchoolClass::create(['organization_id' => $this->org->id, 'name' => 'Grade 9', 'code' => 'G9']);
        $this->section9A = ClassSection::create(['organization_id' => $this->org->id, 'school_class_id' => $this->class9->id, 'name' => 'Section 9-A', 'room' => 'Room 91']);

        // Subjects
        $this->mathSubject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'Advanced Mathematics',
            'code' => 'MATH-10',
            'school_class_id' => $this->class10->id,
            'academic_year_id' => $this->academicYear->id,
        ]);

        $this->englishSubject = Subject::create([
            'organization_id' => $this->org->id,
            'name' => 'English Literature',
            'code' => 'ENG-10',
            'school_class_id' => $this->class10->id,
            'academic_year_id' => $this->academicYear->id,
        ]);

        // Student 1 enrolled in Section 10A
        StudentEnrollment::create([
            'organization_id' => $this->org->id,
            'student_id' => $this->student1->id,
            'academic_year_id' => $this->academicYear->id,
            'class_section_id' => $this->section10A->id,
            'status' => 'active',
            'roll_number' => '10A-01',
        ]);

        // Student 2 enrolled in Section 9A
        StudentEnrollment::create([
            'organization_id' => $this->org->id,
            'student_id' => $this->student2->id,
            'academic_year_id' => $this->academicYear->id,
            'class_section_id' => $this->section9A->id,
            'status' => 'active',
            'roll_number' => '9A-01',
        ]);
    }

    public function test_teacher_cannot_access_classes_directory_or_sections(): void
    {
        // Teacher tries to access Classes Directory
        $responseClasses = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/classes');
        $responseClasses->assertForbidden();

        // Teacher tries to access Sections Administration
        $responseSections = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/sections');
        $responseSections->assertForbidden();

        // Teacher tries to create a new class
        $createClassResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/classes', ['name' => 'Hacked Class', 'code' => 'HCK']);
        $createClassResponse->assertForbidden();

        // Owner CAN access classes and sections
        $ownerClasses = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/classes');
        $ownerClasses->assertOk();

        $ownerSections = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/sections');
        $ownerSections->assertOk();
    }

    public function test_teacher_sees_only_assigned_cohort_students_without_private_details(): void
    {
        // Assign Teacher 1 to Section 10A via TimetableEntry
        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'is_published' => true,
        ]);

        // Teacher visits /school/students
        $response = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/students');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('school/students')
            ->has('enrollments.data', 1)
            ->where('enrollments.data.0.student.id', $this->student1->id)
            ->where('enrollments.data.0.student.name', 'Alice Walker')
        );

        // Teacher cannot view student details of a student outside their cohort (Student 2 in Section 9A)
        $unauthorizedStudentResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get("/school/students/{$this->student2->id}");
        $unauthorizedStudentResponse->assertForbidden();

        // Teacher CAN view student details of assigned cohort student (Student 1)
        $authorizedStudentResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get("/school/students/{$this->student1->id}");
        $authorizedStudentResponse->assertOk();

        // Owner visits /school/students and sees all students
        $ownerResponse = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/students');
        $ownerResponse->assertOk();
        $ownerResponse->assertInertia(fn (Assert $page) => $page
            ->has('enrollments.data', 2)
        );
    }

    public function test_teacher_my_timetable_is_strictly_isolated_to_own_schedule(): void
    {
        // Teacher 1 period: Monday 08:00 - 09:30 (1.5 hours)
        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '09:30:00',
            'is_published' => true,
        ]);

        // Teacher 2 period: Monday 10:00 - 11:00 (1.0 hour)
        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class9->id,
            'class_section_id' => $this->section9A->id,
            'subject_id' => $this->englishSubject->id,
            'teacher_id' => $this->teacher2->id,
            'day_of_week' => 'monday',
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'is_published' => true,
        ]);

        // Teacher 1 visits timetable without filters
        $response = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/timetable');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('school/timetable')
            ->has('entries', 1)
            ->where('entries.0.teacher_id', $this->teacher1->id)
            ->where('teachingHours', 1.5)
        );

        // Teacher 1 attempts to spy on Teacher 2's schedule
        $spyResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/timetable?teacher_id='.$this->teacher2->id);
        $spyResponse->assertForbidden();

        // Teacher 1 attempts to filter by an unauthorized section (Section 9A)
        $unauthorizedFilterResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/school/timetable?class_section_id='.$this->section9A->id);
        $unauthorizedFilterResponse->assertForbidden();
    }

    public function test_daily_first_period_attendance_mode_enforces_first_period_teacher(): void
    {
        $this->org->update(['attendance_mode' => 'daily_first_period']);

        // On Monday:
        // Period 1 (08:00 - 09:00): Teacher 1
        // Period 2 (09:15 - 10:15): Teacher 2
        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'is_published' => true,
        ]);

        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->englishSubject->id,
            'teacher_id' => $this->teacher2->id,
            'day_of_week' => 'monday',
            'start_time' => '09:15:00',
            'end_time' => '10:15:00',
            'is_published' => true,
        ]);

        // A Monday date
        $mondayDate = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        // Teacher 2 (Period 2 teacher) attempts to take daily attendance -> Forbidden
        $teacher2Response = $this->actingAs($this->teacher2)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present', 'remarks' => 'Here'],
                ],
            ]);
        $teacher2Response->assertForbidden();

        // Teacher 1 (Period 1 teacher) takes daily attendance -> Success
        $teacher1Response = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present', 'remarks' => 'On time'],
                ],
            ]);
        $teacher1Response->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section10A->id,
            'student_id' => $this->student1->id,
            'status' => 'present',
            'marked_by' => $this->teacher1->id,
        ]);
    }

    public function test_period_wise_attendance_mode_enforces_period_assignment(): void
    {
        $this->org->update(['attendance_mode' => 'period_wise']);

        $mondayDate = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        $period1 = TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'is_published' => true,
        ]);

        $period2 = TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->englishSubject->id,
            'teacher_id' => $this->teacher2->id,
            'day_of_week' => 'monday',
            'start_time' => '09:15:00',
            'end_time' => '10:15:00',
            'is_published' => true,
        ]);

        // Teacher 1 tries to mark attendance for Period 2 -> Forbidden
        $unauthorizedPeriodResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'timetable_entry_id' => $period2->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present'],
                ],
            ]);
        $unauthorizedPeriodResponse->assertForbidden();

        // Teacher 1 marks attendance for Period 1 -> Success
        $authorizedPeriod1Response = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'timetable_entry_id' => $period1->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present', 'remarks' => 'Math attendance'],
                ],
            ]);
        $authorizedPeriod1Response->assertRedirect();

        // Teacher 2 marks attendance for Period 2 -> Success
        $authorizedPeriod2Response = $this->actingAs($this->teacher2)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'timetable_entry_id' => $period2->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'late', 'remarks' => 'Arrived 5 mins late'],
                ],
            ]);
        $authorizedPeriod2Response->assertRedirect();

        // Both attendance records exist in the database with their respective timetable_entry_id
        $this->assertDatabaseHas('attendances', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section10A->id,
            'timetable_entry_id' => $period1->id,
            'status' => 'present',
        ]);

        $this->assertDatabaseHas('attendances', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section10A->id,
            'timetable_entry_id' => $period2->id,
            'status' => 'late',
        ]);
    }

    public function test_substitute_teacher_workflow_authorized_by_admin(): void
    {
        $mondayDate = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        // Teacher 1 is regular teacher for Period 1
        $period1 = TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'is_published' => true,
        ]);

        // Substitute teacher is NOT yet authorized -> Forbidden
        $preAuthResponse = $this->actingAs($this->substituteTeacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present'],
                ],
            ]);
        $preAuthResponse->assertForbidden();

        // Admin assigns substitute teacher
        $assignResponse = $this->actingAs($this->admin)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance/substitutes', [
                'class_section_id' => $this->section10A->id,
                'substitute_teacher_id' => $this->substituteTeacher->id,
                'date' => $mondayDate,
                'reason' => 'Prof. Clark is out on medical leave',
            ]);
        $assignResponse->assertRedirect();

        $this->assertDatabaseHas('attendance_substitutes', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section10A->id,
            'substitute_teacher_id' => $this->substituteTeacher->id,
        ]);

        // Substitute teacher now takes attendance -> Success
        $postAuthResponse = $this->actingAs($this->substituteTeacher)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present', 'remarks' => 'Substitute Clark covering'],
                ],
            ]);
        $postAuthResponse->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section10A->id,
            'marked_by' => $this->substituteTeacher->id,
        ]);
    }

    public function test_owner_and_admin_fallback_can_mark_attendance_for_any_section(): void
    {
        $date = Carbon::now()->format('Y-m-d');

        // Section 9A has NO assigned timetable entry or teacher
        $ownerResponse = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section9A->id,
                'date' => $date,
                'attendances' => [
                    ['student_id' => $this->student2->id, 'status' => 'present', 'remarks' => 'Owner fallback check'],
                ],
            ]);
        $ownerResponse->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section9A->id,
            'student_id' => $this->student2->id,
            'marked_by' => $this->owner->id,
        ]);
    }

    public function test_attendance_editing_lock_policy(): void
    {
        $mondayDate = Carbon::now()->next(Carbon::MONDAY)->format('Y-m-d');

        // Assign teacher 1
        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00:00',
            'end_time' => '09:00:00',
            'is_published' => true,
        ]);

        // Submit initial attendance
        $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'absent', 'remarks' => 'Not present'],
                ],
            ]);

        // When editing is disabled by organization policy
        $this->org->update(['allow_attendance_editing' => false]);

        // Teacher tries to modify attendance -> Forbidden
        $editAttempt = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present', 'remarks' => 'Correction'],
                ],
            ]);
        $editAttempt->assertForbidden();

        // But Owner CAN modify attendance even when locked for teachers
        $ownerEdit = $this->actingAs($this->owner)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $this->section10A->id,
                'date' => $mondayDate,
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'excused', 'remarks' => 'Admin override'],
                ],
            ]);
        $ownerEdit->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'organization_id' => $this->org->id,
            'class_section_id' => $this->section10A->id,
            'student_id' => $this->student1->id,
            'status' => 'excused',
        ]);
    }

    public function test_tenant_isolation_teacher_cannot_cross_organizations(): void
    {
        // Class & Section in Org B
        $classB = SchoolClass::create(['organization_id' => $this->orgB->id, 'name' => 'Beacon Class 1']);
        $sectionB = ClassSection::create(['organization_id' => $this->orgB->id, 'school_class_id' => $classB->id, 'name' => 'Section B1']);

        // Teacher 1 (only a member in Org A) tries to take attendance in Org B
        $response = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/attendance', [
                'class_section_id' => $sectionB->id,
                'date' => Carbon::now()->format('Y-m-d'),
                'attendances' => [
                    ['student_id' => $this->student1->id, 'status' => 'present'],
                ],
            ]);

        // Must be rejected (either 404 validation because section does not exist in Org A, or 403 forbidden)
        $this->assertTrue(in_array($response->status(), [403, 404, 422, 302]));
        if ($response->status() === 302) {
            $response->assertSessionHasErrors('class_section_id');
        }

        $this->assertDatabaseMissing('attendances', [
            'organization_id' => $this->orgB->id,
            'class_section_id' => $sectionB->id,
        ]);
    }

    public function test_teacher_dashboard_shows_real_metrics_and_schedule(): void
    {
        $today = Carbon::now();
        $dayOfWeek = strtolower($today->format('l'));

        // Assign teacher 1 to a timetable entry today
        TimetableEntry::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
            'day_of_week' => $dayOfWeek,
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'room' => 'Room 101',
            'is_published' => true,
        ]);

        $response = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->get('/dashboard');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('tenant/dashboard-teacher')
            ->has('metrics')
            ->where('metrics.todayPeriodsCount', 1)
            ->has('todaySchedule', 1)
            ->where('todaySchedule.0.subject', 'Advanced Mathematics')
            ->where('todaySchedule.0.class_name', 'Grade 10')
            ->where('todaySchedule.0.section_name', 'Section 10-A')
            ->has('attendanceTasks')
        );
    }

    public function test_teacher_grades_management_scoped_to_assigned_subjects_and_sections(): void
    {
        // Teacher 1 assigned to Section 10A + MathSubject
        ClassSubjectTeacher::create([
            'organization_id' => $this->org->id,
            'academic_year_id' => $this->academicYear->id,
            'school_class_id' => $this->class10->id,
            'class_section_id' => $this->section10A->id,
            'subject_id' => $this->mathSubject->id,
            'teacher_id' => $this->teacher1->id,
        ]);

        // Teacher 1 tries to create assessment for unassigned subject (English) -> 403 Forbidden
        $unassignedAssessmentResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/grades/assessments', [
                'title' => 'Unauthorized Quiz',
                'type' => 'quiz',
                'class_section_id' => $this->section10A->id,
                'subject_id' => $this->englishSubject->id,
                'academic_term_id' => $this->academicTerm->id,
                'max_score' => 50,
            ]);
        $unassignedAssessmentResponse->assertForbidden();

        // Teacher 1 creates assessment for assigned subject (Math) -> Success
        $assignedAssessmentResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post('/school/grades/assessments', [
                'title' => 'Calculus Midterm',
                'type' => 'exam',
                'class_section_id' => $this->section10A->id,
                'subject_id' => $this->mathSubject->id,
                'academic_term_id' => $this->academicTerm->id,
                'max_score' => 100,
            ]);
        $assignedAssessmentResponse->assertRedirect();

        $assessment = Assessment::where('organization_id', $this->org->id)->where('title', 'Calculus Midterm')->first();
        $this->assertNotNull($assessment);

        // Teacher 1 submits grade for student in their section -> Success
        $gradeResponse = $this->actingAs($this->teacher1)
            ->withSession(['current_organization_id' => $this->org->id])
            ->post("/school/grades/{$assessment->id}", [
                'grades' => [
                    [
                        'student_id' => $this->student1->id,
                        'score' => 96.0,
                        'feedback' => 'Exceptional performance in calculus.',
                    ],
                ],
            ]);
        $gradeResponse->assertRedirect();

        $this->assertDatabaseHas('grades', [
            'organization_id' => $this->org->id,
            'assessment_id' => $assessment->id,
            'student_id' => $this->student1->id,
            'score' => 96.0,
        ]);
    }
}
