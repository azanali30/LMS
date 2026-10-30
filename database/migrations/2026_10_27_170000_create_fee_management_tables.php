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
        // 1. Default Class Fee Structures (Class/Academic Year baseline fee plan)
        Schema::create('class_fee_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->decimal('monthly_tuition_fee', 10, 2)->default(0.00);
            $table->decimal('admission_fee', 10, 2)->default(0.00);
            $table->decimal('annual_fee', 10, 2)->default(0.00);
            $table->decimal('other_recurring_charges', 10, 2)->default(0.00);
            $table->string('currency', 5)->default('USD');
            $table->unsignedTinyInteger('due_day')->default(10); // Day of month fee is due (1-31)
            $table->boolean('late_fee_enabled')->default(false);
            $table->decimal('late_fee_amount', 10, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'school_class_id', 'academic_year_id'], 'unique_class_year_fee_plan');
            $table->index(['organization_id', 'school_class_id']);
        });

        // 2. Student Monthly & Custom Fee Invoices
        Schema::create('fee_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_enrollment_id')->nullable()->constrained('student_enrollments')->nullOnDelete();
            $table->foreignId('school_class_id')->constrained('school_classes')->cascadeOnDelete();
            $table->foreignId('class_section_id')->nullable()->constrained('class_sections')->nullOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('invoice_number', 50);
            $table->date('billing_month'); // e.g. '2026-10-01'
            $table->date('issue_date');
            $table->date('due_date');
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->string('discount_reason')->nullable();
            $table->decimal('late_fee', 10, 2)->default(0.00);
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->decimal('paid_amount', 10, 2)->default(0.00);
            $table->decimal('balance_due', 10, 2)->default(0.00);
            $table->string('status', 25)->default('unpaid'); // unpaid, partially_paid, paid, overdue, cancelled
            $table->string('currency', 5)->default('USD');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['organization_id', 'student_id', 'billing_month'], 'unique_org_student_billing_month');
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'due_date']);
            $table->index(['organization_id', 'school_class_id']);
            $table->index(['student_id', 'status']);
        });

        // 3. Invoice Line Items
        Schema::create('fee_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fee_invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
            $table->string('fee_type', 40)->default('tuition'); // tuition, admission, annual, transport, exam, laboratory, other
            $table->string('description', 255);
            $table->decimal('amount', 10, 2)->default(0.00);
            $table->timestamps();

            $table->index(['fee_invoice_id', 'fee_type']);
        });

        // 4. Fee Payments & Verified Collections
        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('fee_invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('payment_number', 50);
            $table->decimal('amount', 10, 2);
            $table->date('payment_date');
            $table->string('payment_method', 30)->default('cash'); // cash, bank_transfer, online, cheque, card, other
            $table->string('reference_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['organization_id', 'fee_invoice_id']);
            $table->index(['organization_id', 'student_id']);
            $table->index(['organization_id', 'payment_date']);
        });

        // 5. Fee Reminder Tracking & Idempotency Logs
        Schema::create('fee_reminder_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('fee_invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->string('recipient_type', 20)->default('student'); // student, guardian
            $table->foreignId('recipient_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recipient_email', 150)->nullable();
            $table->string('recipient_phone', 50)->nullable();
            $table->string('reminder_type', 30); // before_due_10, due_today, overdue_10
            $table->string('channel', 20)->default('in_app'); // in_app, email, sms, whatsapp
            $table->string('status', 25)->default('sent'); // sent, failed, suppressed_paid
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->useCurrent();
            $table->timestamps();

            $table->unique(
                ['fee_invoice_id', 'recipient_type', 'reminder_type', 'channel'],
                'unique_reminder_entry'
            );
            $table->index(['organization_id', 'reminder_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fee_reminder_logs');
        Schema::dropIfExists('fee_payments');
        Schema::dropIfExists('fee_invoice_items');
        Schema::dropIfExists('fee_invoices');
        Schema::dropIfExists('class_fee_structures');
    }
};
