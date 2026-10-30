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
        // 1. Student Profiles (detailed personal, demographic, medical, and contact data)
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('admission_number')->index();
            $table->date('admission_date');
            $table->date('dob')->nullable();
            $table->string('gender')->nullable(); // male, female, other, prefer_not_to_say
            $table->string('phone')->nullable();
            $table->string('nationality')->nullable();
            $table->string('identity_number')->nullable(); // B-Form / CNIC / National ID
            $table->string('previous_school')->nullable();
            $table->string('previous_class')->nullable();
            $table->string('blood_group', 10)->nullable();
            $table->text('medical_notes')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relation')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'admission_number'], 'unique_org_admission_number');
            $table->unique(['organization_id', 'user_id'], 'unique_org_student_user');
            $table->index(['organization_id', 'city']);
        });

        // 2. Student Guardians (primary and secondary parents/guardians)
        Schema::create('student_guardians', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // linked parent user account if exists
            $table->string('name');
            $table->string('relationship')->default('guardian'); // father, mother, guardian, other
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('occupation')->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_emergency_contact')->default(false);
            $table->timestamps();

            $table->index(['organization_id', 'student_id']);
            $table->index(['organization_id', 'user_id']);
        });

        // 3. Student Fee Structures (assigned financial plan, tuition, discounts, and payable dues)
        Schema::create('student_fee_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
            $table->string('fee_category')->default('general'); // general, scholarship, staff_child, sibling_discount, custom
            $table->decimal('monthly_tuition_fee', 10, 2)->default(0.00);
            $table->decimal('admission_fee', 10, 2)->default(0.00); // one-time
            $table->decimal('annual_fee', 10, 2)->default(0.00); // recurring annual
            $table->decimal('other_recurring_charges', 10, 2)->default(0.00);
            $table->string('discount_type')->default('none'); // none, fixed, percentage
            $table->decimal('discount_value', 10, 2)->default(0.00);
            $table->string('discount_reason')->nullable();
            $table->decimal('net_monthly_fee', 10, 2)->default(0.00); // computed net monthly payable
            $table->string('currency', 5)->default('USD');
            $table->string('payment_frequency')->default('monthly'); // monthly, quarterly, semi_annual, annual
            $table->unsignedTinyInteger('due_day')->default(10); // Day of month fee is due (1-31)
            $table->date('effective_date')->nullable();
            $table->text('fee_notes')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'student_id'], 'unique_org_student_fee_structure');
            $table->index(['organization_id', 'fee_category']);
        });

        // 4. Student Documents (admission certificates, B-form, leaving certs, etc.)
        Schema::create('student_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->string('document_type'); // photo, birth_certificate, previous_school_certificate, school_leaving_certificate, other
            $table->string('file_path');
            $table->string('file_name');
            $table->unsignedBigInteger('file_size'); // bytes
            $table->string('mime_type')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_documents');
        Schema::dropIfExists('student_fee_structures');
        Schema::dropIfExists('student_guardians');
        Schema::dropIfExists('student_profiles');
    }
};
