<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrganizationSubscription extends Model
{
    use HasFactory;

    // Supported subscription lifecycle states
    public const STATUS_TRIALING = 'trialing';
    public const STATUS_TRIAL = 'trial'; // backward compatibility
    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAST_DUE = 'past_due';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'organization_id',
        'plan_id',
        'user_id',
        'status',
        'billing_type',
        'payment_method',
        'trial_ends_at',
        'starts_at',
        'ends_at',
        'last_reminded_at',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'last_reminded_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(SubscriptionInvoice::class, 'subscription_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class, 'subscription_id');
    }

    /**
     * Determine if subscription is currently in a valid free trial.
     */
    public function isTrialing(): bool
    {
        return in_array($this->status, [self::STATUS_TRIALING, self::STATUS_TRIAL], true)
            && $this->trial_ends_at !== null
            && $this->trial_ends_at->isFuture();
    }

    /**
     * Determine if trial period has ended.
     */
    public function isTrialExpired(): bool
    {
        if (! in_array($this->status, [self::STATUS_TRIALING, self::STATUS_TRIAL], true)) {
            return $this->status === self::STATUS_EXPIRED;
        }

        return $this->trial_ends_at === null || $this->trial_ends_at->isPast();
    }

    /**
     * Determine if subscription is paid and active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && ($this->ends_at === null || $this->ends_at->isFuture());
    }

    /**
     * Determine if the subscription grants full working access.
     */
    public function hasAccess(): bool
    {
        if ($this->isActive() || $this->isTrialing()) {
            return true;
        }

        // Check configurable grace period
        $graceDays = (int) config('billing.trial_grace_days', 0);
        if ($graceDays > 0 && $this->trial_ends_at && now()->diffInDays($this->trial_ends_at, false) >= -$graceDays) {
            return true;
        }

        return false;
    }

    /**
     * Get remaining trial days (0 if expired).
     */
    public function daysRemainingInTrial(): int
    {
        if (! $this->trial_ends_at || $this->trial_ends_at->isPast()) {
            return 0;
        }

        return (int) ceil(now()->diffInSeconds($this->trial_ends_at, false) / 86400);
    }
}
