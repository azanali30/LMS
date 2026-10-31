<?php

namespace App\Console\Commands;

use App\Models\OrganizationSubscription;
use App\Models\SubscriptionHistory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckTrialSubscriptions extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'subscriptions:check-trials';

    /**
     * The console command description.
     */
    protected $description = 'Process trial expirations, evaluate grace periods, and dispatch configured billing reminders.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Evaluating InstitutoPropio organization subscriptions and trials...');

        $trialSubscriptions = OrganizationSubscription::with(['organization', 'owner', 'plan'])
            ->whereIn('status', [OrganizationSubscription::STATUS_TRIAL, OrganizationSubscription::STATUS_TRIALING])
            ->get();

        $graceDays = (int) config('billing.trial_grace_days', 0);
        $intervals = config('billing.reminder_intervals', [7, 3, 1, 0]);

        $expiredCount = 0;
        $remindedCount = 0;

        foreach ($trialSubscriptions as $subscription) {
            $trialEnds = $subscription->trial_ends_at;

            if (! $trialEnds) {
                continue;
            }

            // Expiry Evaluation
            if ($trialEnds->isPast()) {
                $daysOverdue = (int) abs(now()->diffInDays($trialEnds, false));
                if ($daysOverdue >= $graceDays) {
                    $fromStatus = $subscription->status;

                    $subscription->update([
                        'status' => OrganizationSubscription::STATUS_EXPIRED,
                    ]);

                    SubscriptionHistory::create([
                        'subscription_id' => $subscription->id,
                        'organization_id' => $subscription->organization_id,
                        'user_id' => $subscription->user_id,
                        'event' => 'trial_expired',
                        'from_status' => $fromStatus,
                        'to_status' => OrganizationSubscription::STATUS_EXPIRED,
                        'billing_interval' => $subscription->billing_interval,
                        'metadata' => [
                            'expired_at' => now()->toIso8601String(),
                            'policy' => config('billing.expiry_policy', 'read_only'),
                        ],
                    ]);

                    $expiredCount++;
                    $orgName = $subscription->organization?->name ?? 'Organization #'.$subscription->organization_id;
                    $this->warn("Trial expired for {$orgName} (Data strictly preserved under read-only policy).");
                    Log::info("Trial subscription expired for {$orgName}. Academic and organization data preserved.", [
                        'subscription_id' => $subscription->id,
                        'organization_id' => $subscription->organization_id,
                        'owner_id' => $subscription->user_id,
                    ]);
                    continue;
                }
            }

            // Reminder Evaluation (for active future trials)
            $daysRemaining = $subscription->daysRemainingInTrial();
            if (in_array($daysRemaining, $intervals, true)) {
                $lastReminded = $subscription->last_reminded_at;
                if (! $lastReminded || ! $lastReminded->isToday()) {
                    $owner = $subscription->owner
                        ?? $subscription->organization?->creator
                        ?? $subscription->organization?->members()->wherePivotIn('role', ['owner', 'school_admin'])->first();

                    if ($owner) {
                        try {
                            $owner->notify(new \App\Notifications\TrialExpiringNotification($subscription, $daysRemaining));
                        } catch (\Throwable $e) {
                            Log::error("Failed to dispatch trial reminder notification: {$e->getMessage()}", [
                                'subscription_id' => $subscription->id,
                            ]);
                        }
                    }

                    $subscription->update(['last_reminded_at' => now()]);
                    $remindedCount++;
                }
            }
        }

        $this->info("Completed: {$expiredCount} trial(s) marked expired, {$remindedCount} reminder(s) dispatched.");

        return Command::SUCCESS;
    }
}
