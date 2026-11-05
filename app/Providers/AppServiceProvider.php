<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        \Illuminate\Support\Facades\Gate::policy(\App\Models\Organization::class, \App\Policies\OrganizationPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\FeeInvoice::class, \App\Policies\FeeInvoicePolicy::class);

        // Branded HTML Password Reset Notification
        \Illuminate\Auth\Notifications\ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $resetUrl = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            return (new \Illuminate\Notifications\Messages\MailMessage)
                ->subject('Reset Your Password — InstitutoPropio')
                ->view('emails.password-reset', [
                    'email' => $notifiable->getEmailForPasswordReset(),
                    'resetUrl' => $resetUrl,
                    'count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60),
                ]);
        });

        $this->ensureProductionSchema();
    }

    /**
     * Ensure database schema and default records are present in cloud/production environments.
     */
    protected function ensureProductionSchema(): void
    {
        if (app()->isProduction() && ! app()->runningUnitTests()) {
            try {
                if (! \Illuminate\Support\Facades\Schema::hasTable('notifications') ||
                    ! \Illuminate\Support\Facades\Schema::hasTable('organization_subscriptions') ||
                    ! \Illuminate\Support\Facades\Schema::hasTable('academic_years') ||
                    ! \Illuminate\Support\Facades\Schema::hasTable('platform_audit_logs')) {
                    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
                }

                if (\Illuminate\Support\Facades\Schema::hasTable('subscription_plans') &&
                    \App\Models\SubscriptionPlan::count() === 0) {
                    \Illuminate\Support\Facades\Artisan::call('db:seed', [
                        '--class' => 'SubscriptionPlanSeeder',
                        '--force' => true,
                    ]);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Production schema verification skipped: ' . $e->getMessage());
            }
        }
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
