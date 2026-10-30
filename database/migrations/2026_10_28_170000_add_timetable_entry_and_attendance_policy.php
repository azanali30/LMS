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
        // 1. Add attendance policy configuration to organizations if not yet added
        Schema::table('organizations', function (Blueprint $table) {
            if (! Schema::hasColumn('organizations', 'attendance_mode')) {
                $table->string('attendance_mode')->default('daily_first_period')->after('status');
            }
            if (! Schema::hasColumn('organizations', 'allow_attendance_editing')) {
                $table->boolean('allow_attendance_editing')->default(true)->after('attendance_mode');
            }
        });

        // 2. Ensure class_section_id has its own index before modifying the unique key
        Schema::table('attendances', function (Blueprint $table) {
            $table->index('class_section_id', 'attendances_class_section_id_index');
        });

        // 3. Drop the old unique key and add timetable_entry_id + new composite unique key
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_class_section_id_student_id_date_unique');
            if (! Schema::hasColumn('attendances', 'timetable_entry_id')) {
                $table->foreignId('timetable_entry_id')->nullable()->after('class_section_id')->constrained('timetable_entries')->nullOnDelete();
            }
            $table->unique(['class_section_id', 'student_id', 'date', 'timetable_entry_id'], 'attendances_sec_stu_date_period_unique');
        });

        // 4. Create attendance substitutes table for Owner/Admin-authorized fallback
        if (! Schema::hasTable('attendance_substitutes')) {
            Schema::create('attendance_substitutes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->foreignId('class_section_id')->constrained('class_sections')->cascadeOnDelete();
                $table->foreignId('substitute_teacher_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('timetable_entry_id')->nullable()->constrained('timetable_entries')->nullOnDelete();
                $table->foreignId('authorized_by')->constrained('users')->cascadeOnDelete();
                $table->date('date');
                $table->string('notes')->nullable();
                $table->timestamps();

                $table->index(['organization_id', 'class_section_id', 'date'], 'idx_att_sub_org_sec_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_substitutes');

        Schema::table('attendances', function (Blueprint $table) {
            $table->dropUnique('attendances_sec_stu_date_period_unique');
            if (Schema::hasColumn('attendances', 'timetable_entry_id')) {
                $table->dropConstrainedForeignId('timetable_entry_id');
            }
            $table->unique(['class_section_id', 'student_id', 'date'], 'attendances_class_section_id_student_id_date_unique');
            $table->dropIndex('attendances_class_section_id_index');
        });

        Schema::table('organizations', function (Blueprint $table) {
            if (Schema::hasColumn('organizations', 'attendance_mode')) {
                $table->dropColumn('attendance_mode');
            }
            if (Schema::hasColumn('organizations', 'allow_attendance_editing')) {
                $table->dropColumn('allow_attendance_editing');
            }
        });
    }
};
