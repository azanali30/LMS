<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentApprovalRequest extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_ADDITIONAL_INFO = 'additional_info_required';

    protected $fillable = [
        'email',
        'pending_email',
        'registration_token',
        'current_step',
        'plan_slug',
        'billing_interval',
        'amount_cents',
        'currency',
        'payment_method',
        'transaction_reference',
        'receipt_path',
        'receipt_original_name',
        'receipt_mime',
        'receipt_size_bytes',
        'notes',
        'status',
        'rejection_reason',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'completion_token',
        'token_expires_at',
        'completed_at',
        'created_user_id',
        'created_organization_id',
        'created_subscription_id',
        'ip_address',
    ];

    protected $casts = [
        'current_step' => 'integer',
        'amount_cents' => 'integer',
        'receipt_size_bytes' => 'integer',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'token_expires_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function createdUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_user_id');
    }

    public function createdOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'created_organization_id');
    }

    public function createdSubscription(): BelongsTo
    {
        return $this->belongsTo(OrganizationSubscription::class, 'created_subscription_id');
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    public function isTokenValid(): bool
    {
        if (! $this->isApproved() || $this->isCompleted()) {
            return false;
        }

        if (empty($this->completion_token)) {
            return false;
        }

        if ($this->token_expires_at && Carbon::now()->isAfter($this->token_expires_at)) {
            return false;
        }

        return true;
    }

    public function ensureValidCompletionToken(): string
    {
        if (! $this->isApproved() || $this->isCompleted()) {
            return '';
        }

        if (empty($this->completion_token) || ($this->token_expires_at && Carbon::now()->isAfter($this->token_expires_at))) {
            $token = \Illuminate\Support\Str::random(64);
            $this->update([
                'completion_token' => $token,
                'token_expires_at' => Carbon::now()->addDays(7),
            ]);
            $this->completion_token = $token;
            return $token;
        }

        return $this->completion_token;
    }

    public function trackingStatus(): string
    {
        if ($this->status === self::STATUS_ADDITIONAL_INFO) {
            return 'additional_info_required';
        }

        if ($this->isCompleted()) {
            return 'completed';
        }

        if ($this->isApproved()) {
            return 'awaiting_institution_details';
        }

        if ($this->isPending()) {
            return 'under_review';
        }

        if ($this->isRejected()) {
            return 'rejected';
        }

        return 'pending_payment';
    }

    public function formattedAmount(): string
    {
        $dollars = number_format($this->amount_cents / 100, 2);
        return "{$this->currency} \${$dollars}";
    }

    public function planDisplayName(): string
    {
        return match (strtolower($this->plan_slug)) {
            'starter' => 'Starter ($19/mo)',
            'growth' => 'Growth ($49/mo)',
            'professional' => 'Professional ($99/mo)',
            default => ucfirst($this->plan_slug),
        };
    }
}
