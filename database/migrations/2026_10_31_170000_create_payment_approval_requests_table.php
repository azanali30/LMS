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
        Schema::create('payment_approval_requests', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('plan_slug', 50);
            $table->string('billing_interval', 20)->default('monthly');
            $table->integer('amount_cents')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('payment_method', 50);
            $table->string('transaction_reference', 120)->index();
            $table->string('receipt_path', 255);
            $table->string('receipt_original_name', 255)->nullable();
            $table->string('receipt_mime', 100)->nullable();
            $table->unsignedBigInteger('receipt_size_bytes')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 30)->default('pending')->index(); // pending, approved, rejected
            $table->text('rejection_reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->string('completion_token', 64)->nullable()->unique()->index();
            $table->timestamp('token_expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignId('created_subscription_id')->nullable()->constrained('organization_subscriptions')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['email', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_approval_requests');
    }
};
