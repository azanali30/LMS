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
        // 1. Course Categories
        Schema::create('course_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'slug']);
        });

        // 2. Courses
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('course_categories')->nullOnDelete();
            $table->foreignId('instructor_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->string('level')->default('intermediate'); // beginner, intermediate, advanced
            $table->string('duration')->nullable(); // e.g. "8 Weeks", "24 Hours"
            $table->text('summary')->nullable();
            $table->longText('description')->nullable();
            $table->string('thumbnail_path')->nullable();
            $table->boolean('is_published')->default(false);
            $table->boolean('is_public')->default(false); // public marketplace vs organization private
            $table->decimal('price', 8, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['organization_id', 'slug']);
            $table->index(['organization_id', 'is_published', 'is_public']);
        });

        // 3. Course Modules / Chapters
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order')->default(1);
            $table->timestamps();

            $table->index(['course_id', 'order']);
        });

        // 4. Lessons
        Schema::create('lessons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('course_module_id')->constrained('course_modules')->cascadeOnDelete();
            $table->string('title');
            $table->string('slug');
            $table->longText('content')->nullable();
            $table->string('video_url')->nullable();
            $table->string('attachment_path')->nullable();
            $table->integer('duration_minutes')->default(15);
            $table->integer('order')->default(1);
            $table->boolean('is_free_preview')->default(false);
            $table->timestamps();

            $table->index(['course_module_id', 'order']);
        });

        // 5. Course Enrollments
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('enrolled'); // enrolled, in_progress, completed
            $table->integer('progress_percent')->default(0);
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['course_id', 'user_id']);
            $table->index(['organization_id', 'user_id']);
        });

        // 6. Lesson Completions
        Schema::create('lesson_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('lesson_id')->constrained('lessons')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('completed_at')->useCurrent();
            $table->timestamps();

            $table->unique(['lesson_id', 'user_id']);
            $table->index(['course_id', 'user_id']);
        });

        // 7. Course Assignments
        Schema::create('course_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->string('title');
            $table->text('instructions')->nullable();
            $table->decimal('max_points', 6, 2)->default(100.00);
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'course_id']);
        });

        // 8. Assignment Submissions
        Schema::create('assignment_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('course_assignment_id')->constrained('course_assignments')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->longText('submission_text')->nullable();
            $table->string('attachment_path')->nullable();
            $table->decimal('grade_score', 6, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->foreignId('graded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamp('graded_at')->nullable();
            $table->string('status')->default('submitted'); // submitted, graded, returned
            $table->timestamps();

            $table->unique(['course_assignment_id', 'student_id']);
            $table->index(['organization_id', 'student_id']);
        });

        // 9. Course Certificates
        Schema::create('course_certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('certificate_number')->unique();
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamps();

            $table->unique(['course_id', 'user_id']);
            $table->index(['organization_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_certificates');
        Schema::dropIfExists('assignment_submissions');
        Schema::dropIfExists('course_assignments');
        Schema::dropIfExists('lesson_completions');
        Schema::dropIfExists('course_enrollments');
        Schema::dropIfExists('lessons');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('course_categories');
    }
};
