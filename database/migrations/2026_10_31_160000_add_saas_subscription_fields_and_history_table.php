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
        // 1. Add price_annual_cents to subscription_plans
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('subscription_plans', 'price_annual_cents')) {
                $table->integer('price_annual_cents')->default(0)->after('price_cents');
            }
        });

        // 2. Extend organization_subscriptions with enterprise billing fields
        Schema::table('organization_subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('organization_subscriptions', 'billing_interval')) {
                $table->string('billing_interval', 20)->default('monthly')->after('billing_type');
            }
            if (! Schema::hasColumn('organization_subscriptions', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('billing_interval');
            }
            if (! Schema::hasColumn('organization_subscriptions', 'gateway_customer_id')) {
                $table->string('gateway_customer_id', 120)->nullable()->after('payment_method');
            }
            if (! Schema::hasColumn('organization_subscriptions', 'gateway_subscription_id')) {
                $table->string('gateway_subscription_id', 120)->nullable()->after('gateway_customer_id');
            }
            if (! Schema::hasColumn('organization_subscriptions', 'payment_method_status')) {
                $table->string('payment_method_status', 50)->default('unverified')->after('gateway_subscription_id');
            }
            if (! Schema::hasColumn('organization_subscriptions', 'cancelled_at')) {
                $table->timestamp('cancelled_at')->nullable()->after('ends_at');
            }
        });

        // 3. Create subscription_histories table for tracking lifecycle audits
        if (! Schema::hasTable('subscription_histories')) {
            Schema::create('subscription_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('subscription_id')->constrained('organization_subscriptions')->cascadeOnDelete();
                $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('event', 50); // created, trial_started, payment_method_verified, upgraded, downgraded, renewed, cancelled, expired
                $table->foreignId('from_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
                $table->foreignId('to_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
                $table->string('from_status', 50)->nullable();
                $table->string('to_status', 50)->nullable();
                $table->string('billing_interval', 20)->nullable(); // monthly, annual
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['organization_id', 'created_at']);
                $table->index(['subscription_id', 'event']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_histories');

        Schema::table('organization_subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'billing_interval',
                'currency',
                'gateway_customer_id',
                'gateway_subscription_id',
                'payment_method_status',
                'cancelled_at',
            ]);
        });

        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['price_annual_cents']);
        });
    }
};
