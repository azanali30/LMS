<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price_cents',
        'currency',
        'billing_interval',
        'max_organizations',
        'features',
        'max_students',
        'max_teachers',
        'max_courses',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'max_organizations' => 'integer',
            'features' => 'array',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(OrganizationSubscription::class, 'plan_id');
    }

    /**
     * Determine if this plan permits unlimited organizations.
     */
    public function isUnlimitedOrganizations(): bool
    {
        return $this->max_organizations === null || $this->max_organizations <= 0;
    }

    /**
     * Get human-readable organization entitlement limit.
     */
    public function organizationLimit(): string
    {
        if ($this->isUnlimitedOrganizations()) {
            return 'Unlimited Organizations';
        }

        return $this->max_organizations === 1 ? '1 Organization' : "Up to {$this->max_organizations} Organizations";
    }
}
