<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('desktop_auth_codes')) {
            Schema::create('desktop_auth_codes', function (Blueprint $table) {
                $table->id();
                $table->string('code', 64)->unique();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('code_challenge', 128);
                $table->string('state', 128);
                $table->string('client_ip', 45)->nullable();
                $table->timestamp('expires_at');
                $table->timestamp('used_at')->nullable()->index();
                $table->timestamps();

                $table->index(['code', 'used_at', 'expires_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('desktop_auth_codes');
    }
};
