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
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Starter Academy, Pro School, Enterprise Campus
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->integer('price_cents')->default(0); // in smallest currency unit e.g. cents
            $table->string('currency', 3)->default('USD');
            $table->string('billing_interval')->default('month'); // month, year
            $table->integer('max_students')->default(100);
            $table->integer('max_teachers')->default(10);
            $table->integer('max_courses')->default(25);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('organization_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->string('status')->default('trial'); // trial, active, past_due, cancelled
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_subscriptions');
        Schema::dropIfExists('subscription_plans');
    }
};
