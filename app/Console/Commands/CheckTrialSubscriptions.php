<?php

namespace App\Console\Commands;

use App\Models\OrganizationSubscription;
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
        $this->info('Evaluating organization subscriptions and trials...');

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
                // If past grace period, transition to expired
                $daysOverdue = (int) abs(now()->diffInDays($trialEnds, false));
                if ($daysOverdue >= $graceDays) {
                    $subscription->update([
                        'status' => OrganizationSubscription::STATUS_EXPIRED,
                    ]);

                    $expiredCount++;
                    $orgName = $subscription->organization?->name ?? 'Organization #'.$subscription->organization_id;
                    $this->warn("Trial expired for {$orgName} (Data preserved).");
                    Log::info("Trial subscription expired for {$orgName}. Data preserved under read-only policy.", [
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
                    // Send reminder notification through configured channels (database + mail)
                    if ($owner = $subscription->owner) {
                        try {
                            $owner->notify(new \App\Notifications\TrialExpiringNotification($subscription, $daysRemaining));
                        } catch (\Throwable $e) {
                            Log::error('Failed to dispatch trial reminder notification: '.$e->getMessage());
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
