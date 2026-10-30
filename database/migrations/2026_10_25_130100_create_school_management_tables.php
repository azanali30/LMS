<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Academic Years
        Schema::create('academic_years', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name'); // e.g. "2025-2026 Academic Year"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->index(['organization_id', 'is_current']);
        });

        // 2. Academic Terms
        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('name'); // e.g. "Fall Term 2025", "Semester 1"
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->index(['organization_id', 'academic_year_id']);
        });

        // 3. Classes / Grade Levels
        Schema::create('school_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name'); // e.g. "Grade 10", "Foundation Stage"
            $table->string('code')->nullable(); // e.g. "G10"
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('organization_id');
        });

        // 4. Class Sections
        Schema::create('class_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->string('name'); // e.g. "Section A", "Cohort Blue"
            $table->string('room')->nullable();
            $table->integer('capacity')->default(35);
            $table->timestamps();

            $table->index(['organization_id', 'school_class_id']);
        });

        // 5. Subjects
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name'); // e.g. "Advanced Mathematics", "Computer Science"
            $table->string('code')->nullable(); // e.g. "MATH-401"
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('organization_id');
        });

        // 6. Teacher Subject Assignments
        Schema::create('class_subject_teachers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['organization_id', 'teacher_id']);
        });

        // 7. Student Class Enrollments
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('roll_number')->nullable();
            $table->string('status')->default('active'); // active, transferred, graduated
            $table->timestamps();

            $table->unique(['academic_year_id', 'class_section_id', 'student_id'], 'unique_student_section_year');
            $table->index(['organization_id', 'student_id']);
        });

        // 8. Attendance Records
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('marked_by')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('status')->default('present'); // present, absent, late, excused
            $table->string('remarks')->nullable();
            $table->timestamps();

            $table->unique(['class_section_id', 'student_id', 'date']);
            $table->index(['organization_id', 'date']);
        });

        // 9. Assessments & Exams
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_term_id')->constrained('academic_terms')->cascadeOnDelete();
            $table->string('title'); // e.g. "Midterm Examination", "Unit 3 Test"
            $table->string('type')->default('exam'); // exam, quiz, project, practical
            $table->decimal('max_score', 6, 2)->default(100.00);
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'class_section_id']);
        });

        // 10. Student Assessment Grades
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('assessment_id')->constrained('assessments')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('score', 6, 2);
            $table->text('feedback')->nullable();
            $table->timestamps();

            $table->unique(['assessment_id', 'student_id']);
            $table->index(['organization_id', 'student_id']);
        });

        // 11. Parent - Student Relationships
        Schema::create('parent_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('relationship_type')->default('guardian'); // father, mother, guardian
            $table->timestamps();

            $table->unique(['organization_id', 'parent_id', 'student_id']);
            $table->index(['organization_id', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parent_student');
        Schema::dropIfExists('grades');
        Schema::dropIfExists('assessments');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('student_enrollments');
        Schema::dropIfExists('class_subject_teachers');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('class_sections');
        Schema::dropIfExists('school_classes');
        Schema::dropIfExists('academic_terms');
        Schema::dropIfExists('academic_years');
    }
};
