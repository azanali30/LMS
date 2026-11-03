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
        Schema::table('payment_approval_requests', function (Blueprint $table) {
            if (! Schema::hasColumn('payment_approval_requests', 'current_step')) {
                $table->unsignedTinyInteger('current_step')->default(1)->after('status');
            }

            if (! Schema::hasColumn('payment_approval_requests', 'registration_token')) {
                $table->string('registration_token', 64)->nullable()->unique()->after('current_step');
            }

            if (! Schema::hasColumn('payment_approval_requests', 'pending_email')) {
                $table->string('pending_email', 255)->nullable()->unique()->after('registration_token');
            }

            // Allow drafts to be persisted before step 4 payment proof submission
            $table->string('payment_method', 50)->nullable()->change();
            $table->string('transaction_reference', 120)->nullable()->change();
            $table->string('receipt_path', 255)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_approval_requests', function (Blueprint $table) {
            if (Schema::hasColumn('payment_approval_requests', 'pending_email')) {
                $table->dropColumn('pending_email');
            }

            if (Schema::hasColumn('payment_approval_requests', 'registration_token')) {
                $table->dropColumn('registration_token');
            }

            if (Schema::hasColumn('payment_approval_requests', 'current_step')) {
                $table->dropColumn('current_step');
            }
        });
    }
};
