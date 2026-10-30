<?php

namespace Database\Seeders;

use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Attendance;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\Grade;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\ParentStudent;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class PlatformSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Subscription Plans
        $planStarter = SubscriptionPlan::firstOrCreate(
            ['slug' => 'starter-academy'],
            [
                'name' => 'Starter Academy',
                'description' => 'Ideal for single academies or boutique coaching centers.',
                'price_cents' => 4900,
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_students' => 150,
                'max_teachers' => 10,
                'max_courses' => 20,
                'is_active' => true,
            ]
        );

        $planPro = SubscriptionPlan::firstOrCreate(
            ['slug' => 'pro-campus'],
            [
                'name' => 'Pro Campus',
                'description' => 'Comprehensive multi-branch school management & online learning.',
                'price_cents' => 14900,
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_students' => 1000,
                'max_teachers' => 50,
                'max_courses' => 100,
                'is_active' => true,
            ]
        );

        // 2. Platform Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@skillforge.io'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('Password123!'),
                'role' => 'super_admin',
                'email_verified_at' => now(),
            ]
        );

        // 3. Organization 1: Horizon STEM Academy
        $director = User::firstOrCreate(
            ['email' => 'director@horizon.edu'],
            [
                'name' => 'Dr. Julian Vance',
                'password' => Hash::make('Password123!'),
                'role' => 'student',
                'email_verified_at' => now(),
            ]
        );

        $orgHorizon = Organization::firstOrCreate(
            ['slug' => 'horizon-stem-academy'],
            [
                'name' => 'Horizon STEM Academy',
                'organization_type' => 'school',
                'email' => 'info@horizon.edu',
                'phone' => '+1 (555) 234-5678',
                'address' => '450 Innovation Parkway, Tech District, CA',
                'timezone' => 'America/Los_Angeles',
                'status' => 'active',
                'created_by' => $director->id,
            ]
        );

        // Director membership as Owner
        OrganizationUser::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'user_id' => $director->id],
            ['role' => 'owner', 'status' => 'active', 'title' => 'Director of Academics']
        );

        // Attach Pro Subscription
        OrganizationSubscription::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'plan_id' => $planPro->id],
            ['status' => 'active', 'starts_at' => now()]
        );

        // Teacher
        $teacher = User::firstOrCreate(
            ['email' => 'teacher@horizon.edu'],
            [
                'name' => 'Prof. Sophia Laurent',
                'password' => Hash::make('Password123!'),
                'role' => 'student',
                'email_verified_at' => now(),
            ]
        );
        OrganizationUser::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'user_id' => $teacher->id],
            ['role' => 'teacher', 'status' => 'active', 'title' => 'Lead CS & Physics Teacher']
        );

        // Student
        $student = User::firstOrCreate(
            ['email' => 'student@horizon.edu'],
            [
                'name' => 'Liam Sterling',
                'password' => Hash::make('Password123!'),
                'role' => 'student',
                'email_verified_at' => now(),
            ]
        );
        OrganizationUser::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'user_id' => $student->id],
            ['role' => 'student', 'status' => 'active', 'title' => 'Grade 10 Scholar']
        );

        // Parent
        $parent = User::firstOrCreate(
            ['email' => 'parent@horizon.edu'],
            [
                'name' => 'Marcus Sterling',
                'password' => Hash::make('Password123!'),
                'role' => 'student',
                'email_verified_at' => now(),
            ]
        );
        OrganizationUser::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'user_id' => $parent->id],
            ['role' => 'parent', 'status' => 'active', 'title' => 'Parent Guardian']
        );

        // Link parent to student
        ParentStudent::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'parent_id' => $parent->id, 'student_id' => $student->id],
            ['relationship_type' => 'father']
        );

        // Academic Structure
        $academicYear = AcademicYear::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'name' => '2025-2026 Academic Session'],
            ['start_date' => '2025-09-01', 'end_date' => '2026-06-30', 'is_current' => true]
        );

        $termFall = AcademicTerm::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'academic_year_id' => $academicYear->id, 'name' => 'Fall Term 2025'],
            ['start_date' => '2025-09-01', 'end_date' => '2025-12-20', 'is_current' => true]
        );

        $termSpring = AcademicTerm::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'academic_year_id' => $academicYear->id, 'name' => 'Spring Term 2026'],
            ['start_date' => '2026-01-05', 'end_date' => '2026-06-20', 'is_current' => false]
        );

        $classG10 = SchoolClass::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'name' => 'Grade 10'],
            ['code' => 'G10', 'description' => 'Sophomore College Preparatory Track']
        );

        $sectionA = ClassSection::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'school_class_id' => $classG10->id, 'name' => 'Section A'],
            ['room' => 'Room 302', 'capacity' => 30]
        );

        $subjCS = Subject::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'name' => 'Computer Science & Algorithms'],
            ['code' => 'CS-101', 'description' => 'Foundations of structured programming and web architecture']
        );

        $subjMath = Subject::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'name' => 'Advanced Pre-Calculus'],
            ['code' => 'MATH-201', 'description' => 'Trigonometry, vectors, and discrete mathematics']
        );

        // Teacher assignment
        ClassSubjectTeacher::firstOrCreate([
            'organization_id' => $orgHorizon->id,
            'academic_year_id' => $academicYear->id,
            'class_section_id' => $sectionA->id,
            'subject_id' => $subjCS->id,
            'teacher_id' => $teacher->id,
        ]);

        // Student Enrollment
        StudentEnrollment::firstOrCreate([
            'organization_id' => $orgHorizon->id,
            'academic_year_id' => $academicYear->id,
            'class_section_id' => $sectionA->id,
            'student_id' => $student->id,
        ], ['roll_number' => 'G10-042', 'status' => 'active']);

        // Attendance record
        Attendance::firstOrCreate([
            'organization_id' => $orgHorizon->id,
            'class_section_id' => $sectionA->id,
            'student_id' => $student->id,
            'date' => now()->toDateString(),
        ], [
            'marked_by' => $teacher->id,
            'status' => 'present',
            'remarks' => 'On time and actively engaged',
        ]);

        // Assessment and Grade
        $assessment = Assessment::firstOrCreate([
            'organization_id' => $orgHorizon->id,
            'class_section_id' => $sectionA->id,
            'subject_id' => $subjCS->id,
            'academic_term_id' => $termFall->id,
            'title' => 'Algorithms & Data Structures Midterm',
        ], [
            'type' => 'exam',
            'max_score' => 100.00,
            'due_date' => now()->addDays(5)->toDateString(),
        ]);

        Grade::firstOrCreate([
            'organization_id' => $orgHorizon->id,
            'assessment_id' => $assessment->id,
            'student_id' => $student->id,
        ], [
            'score' => 94.50,
            'feedback' => 'Exceptional implementation of binary search and recursion.',
            'graded_by' => $teacher->id,
        ]);

        // Course Category and Course
        $catEng = CourseCategory::firstOrCreate(
            ['slug' => 'engineering'],
            ['name' => 'Software Engineering', 'description' => 'Full-stack software engineering']
        );

        $courseWeb = Course::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'slug' => 'fullstack-web-architecture'],
            [
                'category_id' => $catEng->id,
                'instructor_id' => $teacher->id,
                'title' => 'Full-Stack Modern Web Engineering: Laravel & React',
                'level' => 'advanced',
                'duration' => '10 Weeks',
                'summary' => 'Build high-concurrency SaaS applications with Laravel 13, React 19, and Inertia.',
                'description' => 'A complete masterclass in production Laravel and modern React single page apps.',
                'is_published' => true,
                'is_public' => true,
                'price' => 0.00,
            ]
        );

        $mod1 = CourseModule::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'course_id' => $courseWeb->id, 'title' => 'Module 1: Multi-Tenant Architecture'],
            ['description' => 'Core concepts of tenant isolation, scoping, and data safety', 'order' => 1]
        );

        $les1 = Lesson::firstOrCreate(
            ['organization_id' => $orgHorizon->id, 'course_module_id' => $mod1->id, 'slug' => 'introduction-to-tenancy'],
            [
                'title' => '1.1 Introduction to Multi-Tenant Database Scopes',
                'content' => 'In this lesson, we study tenant scoping using Eloquent global scopes and context management.',
                'video_url' => 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
                'duration_minutes' => 20,
                'order' => 1,
                'is_free_preview' => true,
            ]
        );

        // Student Course Enrollment
        CourseEnrollment::firstOrCreate([
            'organization_id' => $orgHorizon->id,
            'course_id' => $courseWeb->id,
            'user_id' => $student->id,
        ], [
            'status' => 'in_progress',
            'progress_percent' => 50,
            'enrolled_at' => now()->subDays(10),
        ]);

        LessonCompletion::firstOrCreate([
            'organization_id' => $orgHorizon->id,
            'course_id' => $courseWeb->id,
            'lesson_id' => $les1->id,
            'user_id' => $student->id,
        ]);
    }
}
