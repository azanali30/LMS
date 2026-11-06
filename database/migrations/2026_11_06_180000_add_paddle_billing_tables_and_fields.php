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
        // 1. Dedicated table for strict webhook event idempotency & deduplication
        if (! Schema::hasTable('paddle_webhook_events')) {
            Schema::create('paddle_webhook_events', function (Blueprint $table) {
                $table->id();
                $table->string('event_id', 100)->unique();
                $table->string('event_type', 100);
                $table->json('payload')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();

                $table->index(['event_type', 'created_at']);
            });
        }

        // 2. Add Paddle price ID columns to subscription_plans
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (! Schema::hasColumn('subscription_plans', 'paddle_price_id_monthly')) {
                $table->string('paddle_price_id_monthly', 100)->nullable()->after('is_active');
            }
            if (! Schema::hasColumn('subscription_plans', 'paddle_price_id_annual')) {
                $table->string('paddle_price_id_annual', 100)->nullable()->after('paddle_price_id_monthly');
            }
        });

        // 3. Add Paddle transaction & checkout tracking to organization_subscriptions
        Schema::table('organization_subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('organization_subscriptions', 'paddle_transaction_id')) {
                $table->string('paddle_transaction_id', 120)->nullable()->after('gateway_subscription_id');
            }
            if (! Schema::hasColumn('organization_subscriptions', 'paddle_checkout_id')) {
                $table->string('paddle_checkout_id', 120)->nullable()->after('paddle_transaction_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organization_subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('organization_subscriptions', 'paddle_checkout_id')) {
                $table->dropColumn('paddle_checkout_id');
            }
            if (Schema::hasColumn('organization_subscriptions', 'paddle_transaction_id')) {
                $table->dropColumn('paddle_transaction_id');
            }
        });

        Schema::table('subscription_plans', function (Blueprint $table) {
            if (Schema::hasColumn('subscription_plans', 'paddle_price_id_annual')) {
                $table->dropColumn('paddle_price_id_annual');
            }
            if (Schema::hasColumn('subscription_plans', 'paddle_price_id_monthly')) {
                $table->dropColumn('paddle_price_id_monthly');
            }
        });

        Schema::dropIfExists('paddle_webhook_events');
    }
};

