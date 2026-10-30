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
        if (Schema::hasTable('class_fee_structures') && ! Schema::hasColumn('class_fee_structures', 'transport_fee')) {
            Schema::table('class_fee_structures', function (Blueprint $table) {
                $table->decimal('transport_fee', 10, 2)->default(0.00)->after('annual_fee');
            });
        }

        if (Schema::hasTable('student_fee_structures') && ! Schema::hasColumn('student_fee_structures', 'transport_fee')) {
            Schema::table('student_fee_structures', function (Blueprint $table) {
                $table->decimal('transport_fee', 10, 2)->default(0.00)->after('annual_fee');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('class_fee_structures') && Schema::hasColumn('class_fee_structures', 'transport_fee')) {
            Schema::table('class_fee_structures', function (Blueprint $table) {
                $table->dropColumn('transport_fee');
            });
        }

        if (Schema::hasTable('student_fee_structures') && Schema::hasColumn('student_fee_structures', 'transport_fee')) {
            Schema::table('student_fee_structures', function (Blueprint $table) {
                $table->dropColumn('transport_fee');
            });
        }
    }
};
