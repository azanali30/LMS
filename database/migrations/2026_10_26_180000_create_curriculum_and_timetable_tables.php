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
        // 1. Extend subjects table
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('school_class_id')->nullable()->after('organization_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->after('school_class_id')->constrained('academic_years')->nullOnDelete();
            $table->string('type')->default('core')->after('description'); // core, elective, practical, language, vocational
        });

        // 2. Class-Subject pivot table for sharing subjects across multiple classes
        Schema::create('class_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            $table->timestamps();

            $table->unique(['school_class_id', 'subject_id'], 'uniq_cls_subj');
            $table->index(['organization_id', 'school_class_id'], 'idx_cls_subj_org');
        });

        // 3. Curriculums / Syllabi
        Schema::create('curriculums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('school_class_id')->nullable()->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('draft'); // draft, published, archived
            $table->timestamps();

            $table->index(['organization_id', 'subject_id'], 'idx_curr_org_subj');
            $table->index(['organization_id', 'status'], 'idx_curr_org_status');
        });

        // 4. Curriculum Units / Chapters
        Schema::create('curriculum_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('curriculum_id')->constrained('curriculums')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('order')->default(1);
            $table->integer('estimated_periods')->nullable();
            $table->timestamps();

            $table->index(['curriculum_id', 'order'], 'idx_unit_curr_order');
        });

        // 5. Curriculum Topics
        Schema::create('curriculum_topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('curriculum_unit_id')->constrained('curriculum_units')->cascadeOnDelete();
            $table->string('title');
            $table->text('learning_objectives')->nullable();
            $table->text('content_summary')->nullable();
            $table->integer('order')->default(1);
            $table->string('status')->default('published'); // draft, published
            $table->timestamps();

            $table->index(['curriculum_unit_id', 'order'], 'idx_topic_unit_order');
        });

        // 6. Curriculum Topic Progress for teacher/section tracking
        Schema::create('curriculum_topic_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('curriculum_topic_id')->constrained('curriculum_topics')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('completed'); // in_progress, completed
            $table->text('notes')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['curriculum_topic_id', 'class_section_id'], 'uniq_topic_sec_prog');
        });

        // 7. Timetables (Weekly master schedule container per class section)
        Schema::create('timetables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->string('title');
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['organization_id', 'class_section_id'], 'idx_tt_org_sec');
        });

        // 8. Timetable Entries / Periods
        Schema::create('timetable_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('timetable_id')->nullable()->constrained('timetables')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('day_of_week'); // monday, tuesday, wednesday, thursday, friday, saturday, sunday
            $table->string('period_name')->nullable(); // e.g. "Period 1", "Morning Block"
            $table->time('start_time');
            $table->time('end_time');
            $table->string('room')->nullable();
            $table->string('notes')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['organization_id', 'class_section_id', 'day_of_week'], 'idx_tte_sec_day');
            $table->index(['organization_id', 'teacher_id', 'day_of_week'], 'idx_tte_tch_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetable_entries');
        Schema::dropIfExists('timetables');
        Schema::dropIfExists('curriculum_topic_progress');
        Schema::dropIfExists('curriculum_topics');
        Schema::dropIfExists('curriculum_units');
        Schema::dropIfExists('curriculums');
        Schema::dropIfExists('class_subject');
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_class_id');
            $table->dropConstrainedForeignId('academic_year_id');
            $table->dropColumn(['type']);
        });
    }
};
