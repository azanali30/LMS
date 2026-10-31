<?php

namespace App\Services\Billing;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionHistory;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use LogicException;

class SubscriptionService
{
    /**
     * Determine server-side trial eligibility for a user and organization candidate.
    /**
     * Boolean helper for trial eligibility.
     */
    public function isEligibleForTrial(User $user, ?string $subdomain = null, ?string $organizationName = null): bool
    {
        return $this->checkTrialEligibility($user, $subdomain, $organizationName)['eligible'] ?? false;
    }

    /**
     * Multi-factor server-side trial eligibility check.
     * Prevents repeated trial abuse via duplicate emails, domains, or owner accounts.
     *
     * @return array{eligible: bool, reason?: string}
     */
    public function checkTrialEligibility(User $user, ?string $subdomain = null, ?string $organizationName = null): array
    {
        // Platform super admins are always eligible
        if ($user->isSuperAdmin()) {
            return ['eligible' => true];
        }

        // 1. Check if user already owns any organization with an active or historical trial/subscription
        $directOrgIds = Organization::where('created_by', $user->id)->pluck('id');
        $pivotOrgIds = $user->organizations()
            ->wherePivotIn('role', ['owner', 'school_admin'])
            ->pluck('organizations.id');
        $ownedOrgIds = $directOrgIds->merge($pivotOrgIds)->unique();

        if ($ownedOrgIds->isNotEmpty()) {
            $hasExistingTrial = OrganizationSubscription::whereIn('organization_id', $ownedOrgIds)
                ->whereIn('status', [
                    OrganizationSubscription::STATUS_TRIALING,
                    OrganizationSubscription::STATUS_TRIAL,
                    OrganizationSubscription::STATUS_ACTIVE,
                    OrganizationSubscription::STATUS_EXPIRED,
                    OrganizationSubscription::STATUS_PENDING_PAYMENT_METHOD,
                ])
                ->exists();

            if ($hasExistingTrial) {
                return [
                    'eligible' => false,
                    'reason' => 'An active or completed trial already exists for your institution owner account.',
                ];
            }
        }

        // 2. Check if a subscription was previously created under this specific user ID
        $hasUserSub = OrganizationSubscription::where('user_id', $user->id)
            ->whereIn('status', [
                OrganizationSubscription::STATUS_TRIALING,
                OrganizationSubscription::STATUS_TRIAL,
                OrganizationSubscription::STATUS_ACTIVE,
                OrganizationSubscription::STATUS_EXPIRED,
            ])
            ->exists();

        if ($hasUserSub) {
            return [
                'eligible' => false,
                'reason' => 'A 30-day free trial has already been utilized by this user account.',
            ];
        }

        // 3. Multi-factor duplicate prevention: normalized organization name & slug
        if ($organizationName) {
            $normalizedName = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $organizationName)));
            if (! empty($normalizedName)) {
                $matchedOrg = Organization::all()->first(function ($org) use ($normalizedName) {
                    $cleaned = strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', '', $org->name)));
                    return $cleaned === $normalizedName;
                });

                if ($matchedOrg && $matchedOrg->subscriptions()->exists()) {
                    return [
                        'eligible' => false,
                        'reason' => "An institution matching '{$organizationName}' has already claimed a free trial.",
                    ];
                }
            }
        }

        if ($subdomain) {
            $slug = strtolower(trim($subdomain));
            $existing = Organization::where('slug', $slug)->first();
            if ($existing && $existing->subscriptions()->exists()) {
                return [
                    'eligible' => false,
                    'reason' => "Subdomain '{$slug}' is already associated with an existing subscription.",
                ];
            }
        }

        return ['eligible' => true];
    }

    /**
     * Create initial subscription for a newly registered organization.
     * Enforces the critical SaaS business rule:
     * In production, the subscription starts as 'pending_payment_method' until verified.
     */
    public function createInitialSubscription(
        Organization $organization,
        User $owner,
        SubscriptionPlan $plan,
        string $interval = 'monthly'
    ): OrganizationSubscription {
        $currency = config('plans.currency', 'USD');
        $trialDays = (int) config('plans.trial_days', 30);
        $normalizedInterval = in_array(strtolower($interval), ['annual', 'yearly', 'year'], true) ? 'annual' : 'monthly';

        // Check if dev/test bypass is permitted
        $shouldBypass = $this->isDevBypassPermitted();

        return DB::transaction(function () use (
            $organization,
            $owner,
            $plan,
            $currency,
            $trialDays,
            $normalizedInterval,
            $shouldBypass
        ) {
            $status = $shouldBypass
                ? OrganizationSubscription::STATUS_TRIALING
                : OrganizationSubscription::STATUS_PENDING_PAYMENT_METHOD;

            $startsAt = $shouldBypass ? now() : null;
            $trialEndsAt = $shouldBypass ? now()->addDays($trialDays) : null;
            $paymentMethodStatus = $shouldBypass ? 'verified' : 'unverified';

            $subscription = OrganizationSubscription::create([
                'organization_id' => $organization->id,
                'plan_id' => $plan->id,
                'user_id' => $owner->id,
                'status' => $status,
                'billing_type' => $shouldBypass ? 'trial' : 'online',
                'billing_interval' => $normalizedInterval,
                'currency' => $currency,
                'payment_method_status' => $paymentMethodStatus,
                'starts_at' => $startsAt,
                'trial_ends_at' => $trialEndsAt,
            ]);

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'organization_id' => $organization->id,
                'user_id' => $owner->id,
                'event' => 'created',
                'to_plan_id' => $plan->id,
                'to_status' => $status,
                'billing_interval' => $normalizedInterval,
                'metadata' => [
                    'plan_slug' => $plan->slug,
                    'bypassed_in_dev' => $shouldBypass,
                    'trial_days' => $trialDays,
                ],
            ]);

            return $subscription;
        });
    }

    /**
     * Activate the 30-day trial upon verified server-side payment method setup.
     * Never trusts browser redirects; strictly requires verified provider confirmation.
     */
    public function activateTrialAfterPaymentVerification(
        OrganizationSubscription $subscription,
        string $paymentMethodReference,
        ?string $gatewayCustomerId = null,
        ?string $gatewaySubscriptionId = null,
        array $metadata = []
    ): OrganizationSubscription {
        if ($subscription->isActive() || $subscription->isTrialing()) {
            return $subscription;
        }

        $trialDays = (int) config('plans.trial_days', 30);

        return DB::transaction(function () use (
            $subscription,
            $paymentMethodReference,
            $gatewayCustomerId,
            $gatewaySubscriptionId,
            $trialDays,
            $metadata
        ) {
            $fromStatus = $subscription->status;

            $subscription->update([
                'status' => OrganizationSubscription::STATUS_TRIALING,
                'billing_type' => 'online',
                'payment_method' => $paymentMethodReference,
                'payment_method_status' => 'verified',
                'gateway_customer_id' => $gatewayCustomerId ?: $subscription->gateway_customer_id,
                'gateway_subscription_id' => $gatewaySubscriptionId ?: $subscription->gateway_subscription_id,
                'starts_at' => now(),
                'trial_ends_at' => now()->addDays($trialDays),
            ]);

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'organization_id' => $subscription->organization_id,
                'user_id' => $subscription->user_id,
                'event' => 'trial_activated',
                'from_status' => $fromStatus,
                'to_status' => OrganizationSubscription::STATUS_TRIALING,
                'billing_interval' => $subscription->billing_interval,
                'metadata' => array_merge([
                    'payment_method' => $paymentMethodReference,
                    'gateway_customer_id' => $gatewayCustomerId,
                    'trial_days' => $trialDays,
                ], $metadata),
            ]);

            return $subscription->fresh();
        });
    }

    /**
     * Upgrade or downgrade plan with strict institution limit validation.
     */
    public function changePlan(
        OrganizationSubscription $subscription,
        SubscriptionPlan $newPlan,
        ?string $newInterval = null,
        ?User $actor = null
    ): OrganizationSubscription {
        $owner = $subscription->owner ?: $actor;
        $interval = $newInterval ? (in_array(strtolower($newInterval), ['annual', 'yearly', 'year'], true) ? 'annual' : 'monthly') : $subscription->billing_interval;

        // Institution limit validation for downgrades
        if ($owner && ! $newPlan->isUnlimitedOrganizations()) {
            $ownedCount = $owner->organizations()->wherePivot('role', 'owner')->count();
            if ($ownedCount > $newPlan->max_organizations) {
                throw ValidationException::withMessages([
                    'plan_id' => "Cannot change to {$newPlan->name} plan. You currently manage {$ownedCount} institutions, but {$newPlan->name} permits a maximum of {$newPlan->max_organizations}.",
                ]);
            }
        }

        return DB::transaction(function () use ($subscription, $newPlan, $interval, $actor) {
            $fromPlanId = $subscription->plan_id;
            $fromStatus = $subscription->status;

            $subscription->update([
                'plan_id' => $newPlan->id,
                'billing_interval' => $interval,
            ]);

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'organization_id' => $subscription->organization_id,
                'user_id' => $actor?->id,
                'event' => 'plan_changed',
                'from_plan_id' => $fromPlanId,
                'to_plan_id' => $newPlan->id,
                'from_status' => $fromStatus,
                'to_status' => $subscription->status,
                'billing_interval' => $interval,
                'metadata' => [
                    'new_plan_name' => $newPlan->name,
                    'new_interval' => $interval,
                    'actor_id' => $actor?->id,
                ],
            ]);

            return $subscription->fresh();
        });
    }

    /**
     * Cancel an active or trialing subscription.
     */
    public function cancelSubscription(
        OrganizationSubscription $subscription,
        ?string $reason = null,
        ?User $actor = null
    ): OrganizationSubscription {
        return DB::transaction(function () use ($subscription, $reason, $actor) {
            $fromStatus = $subscription->status;

            $subscription->update([
                'status' => OrganizationSubscription::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);

            SubscriptionHistory::create([
                'subscription_id' => $subscription->id,
                'organization_id' => $subscription->organization_id,
                'user_id' => $actor?->id,
                'event' => 'cancelled',
                'from_status' => $fromStatus,
                'to_status' => OrganizationSubscription::STATUS_CANCELLED,
                'billing_interval' => $subscription->billing_interval,
                'metadata' => [
                    'reason' => $reason,
                    'actor_id' => $actor?->id,
                ],
            ]);

            return $subscription->fresh();
        });
    }

    /**
     * Safe development-only test mechanism for simulating trial activation locally.
     * STRICT SECURITY: Must throw if invoked in production or when dev bypass is disabled.
     */
    public function activateDevTrialBypass(OrganizationSubscription $subscription): OrganizationSubscription
    {
        if (! $this->isDevBypassPermitted()) {
            Log::warning('Security violation: Attempted dev trial bypass in unauthorized environment.', [
                'env' => app()->environment(),
                'subscription_id' => $subscription->id,
            ]);
            throw new LogicException('Trial bypass is strictly disabled in production. Verified payment method is required.');
        }

        return $this->activateTrialAfterPaymentVerification(
            $subscription,
            'dev_verified_pm_'.bin2hex(random_bytes(6)),
            'cus_dev_test',
            'sub_dev_test',
            ['simulated_dev_environment' => true]
        );
    }

    /**
     * Determine if development bypass is permissible.
     */
    public function isDevBypassPermitted(): bool
    {
        if (app()->environment('production') || config('app.env') === 'production') {
            return false;
        }

        if (! config('billing.allow_dev_trial_bypass', false) && ! app()->runningUnitTests()) {
            return false;
        }

        return true;
    }
}
