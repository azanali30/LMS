<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                if (! Schema::hasColumn('notifications', 'organization_id')) {
                    $table->unsignedBigInteger('organization_id')->nullable()->after('notifiable_id')->index();
                }
                if (! Schema::hasColumn('notifications', 'category')) {
                    $table->string('category', 40)->default('system')->after('organization_id')->index();
                }
                if (! Schema::hasColumn('notifications', 'scope')) {
                    $table->string('scope', 20)->default('organization')->after('category')->index();
                }

                $table->index(
                    ['notifiable_type', 'notifiable_id', 'organization_id', 'read_at'],
                    'notifications_notifiable_org_read_idx'
                );
                $table->index(
                    ['notifiable_type', 'notifiable_id', 'scope', 'created_at'],
                    'notifications_notifiable_scope_created_idx'
                );
            });
        }

        if (! Schema::hasTable('notification_preferences')) {
            Schema::create('notification_preferences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();
                $table->string('category', 40);
                $table->boolean('in_app')->default(true);
                $table->boolean('browser')->default(false);
                $table->boolean('email')->default(false);
                $table->timestamps();

                $table->unique(['user_id', 'organization_id', 'category'], 'notif_prefs_user_org_cat_unique');
                $table->index(['organization_id', 'category'], 'notif_prefs_org_cat_idx');
            });
        }

        if (! Schema::hasTable('timetable_reminder_logs')) {
            Schema::create('timetable_reminder_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->foreignId('timetable_entry_id')->constrained('timetable_entries')->cascadeOnDelete();
                $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
                $table->date('reminder_date');
                $table->string('scheduled_for', 10);
                $table->timestamp('sent_at');
                $table->timestamps();

                $table->unique(
                    ['timetable_entry_id', 'teacher_id', 'reminder_date'],
                    'timetable_reminder_unique'
                );
                $table->index(['organization_id', 'reminder_date'], 'timetable_reminder_org_date_idx');
            });
        }

        if (Schema::hasTable('timetable_entries') && ! Schema::hasColumn('timetable_entries', 'is_cancelled')) {
            Schema::table('timetable_entries', function (Blueprint $table) {
                $table->boolean('is_cancelled')->default(false)->after('is_published');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('timetable_entries') && Schema::hasColumn('timetable_entries', 'is_cancelled')) {
            Schema::table('timetable_entries', function (Blueprint $table) {
                $table->dropColumn('is_cancelled');
            });
        }

        Schema::dropIfExists('timetable_reminder_logs');
        Schema::dropIfExists('notification_preferences');

        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex('notifications_notifiable_org_read_idx');
                $table->dropIndex('notifications_notifiable_scope_created_idx');
                if (Schema::hasColumn('notifications', 'scope')) {
                    $table->dropColumn('scope');
                }
                if (Schema::hasColumn('notifications', 'category')) {
                    $table->dropColumn('category');
                }
                if (Schema::hasColumn('notifications', 'organization_id')) {
                    $table->dropColumn('organization_id');
                }
            });
        }
    }
};

