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
        // 1. Add max_organizations and features to subscription_plans
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->integer('max_organizations')->nullable()->after('billing_interval'); // null = unlimited
            $table->json('features')->nullable()->after('max_organizations');
        });

        // 2. Add billing details to organization_subscriptions
        Schema::table('organization_subscriptions', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('plan_id')->constrained('users')->nullOnDelete();
            $table->string('billing_type')->default('online')->after('status'); // online, manual_invoice
            $table->string('payment_method')->nullable()->after('billing_type');
            $table->timestamp('last_reminded_at')->nullable()->after('ends_at');
        });

        // 3. Create subscription_invoices table for manual invoice workflow and online invoices
        Schema::create('subscription_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50)->unique();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('organization_subscriptions')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->integer('amount_cents')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('billing_type')->default('manual_invoice'); // manual_invoice, online
            $table->string('status')->default('pending'); // pending, paid, cancelled, refunded
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status']);
            $table->index(['user_id', 'status']);
        });

        // 4. Create payment_transactions table for idempotent webhook & payment processing
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_reference', 120)->unique();
            $table->foreignId('subscription_id')->nullable()->constrained('organization_subscriptions')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('subscription_invoices')->nullOnDelete();
            $table->string('gateway', 50); // manual, stripe, mock_gateway
            $table->string('event_type', 100); // payment.succeeded, invoice.created, manual.verified
            $table->integer('amount_cents')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->string('status')->default('processed'); // processed, failed, pending
            $table->json('payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['gateway', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('subscription_invoices');

        Schema::table('organization_subscriptions', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'billing_type', 'payment_method', 'last_reminded_at']);
        });

        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['max_organizations', 'features']);
        });
    }
};
