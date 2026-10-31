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
        'price_annual_cents',
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
            'price_cents' => 'integer',
            'price_annual_cents' => 'integer',
            'max_organizations' => 'integer',
            'features' => 'array',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(OrganizationSubscription::class, 'plan_id');
    }

    /**
     * Resolve a legacy plan slug alias to the official tier slug.
     */
    public static function resolveSlugAlias(string $slug): string
    {
        $normalized = strtolower(trim($slug));
        $aliases = config('plans.legacy_aliases', []);

        return $aliases[$normalized] ?? $normalized;
    }

    /**
     * Resolve a plan by slug, respecting legacy aliases (e.g. bronze -> starter).
     */
    public static function findBySlug(string $slug): ?self
    {
        $normalized = strtolower(trim($slug));
        $plan = self::where('slug', $normalized)->first();

        if ($plan) {
            return $plan;
        }

        $aliases = config('plans.legacy_aliases', []);
        $targetSlug = $aliases[$normalized] ?? null;

        if ($targetSlug) {
            return self::where('slug', $targetSlug)->first();
        }

        return null;
    }

    /**
     * Determine if this plan permits unlimited institutions.
     */
    public function isUnlimitedOrganizations(): bool
    {
        return $this->max_organizations === null || $this->max_organizations <= 0;
    }

    /**
     * Get human-readable institution entitlement limit.
     */
    public function organizationLimit(): string
    {
        if ($this->isUnlimitedOrganizations()) {
            return 'Unlimited Institutions';
        }

        return $this->max_organizations === 1 ? '1 Institution' : "Up to {$this->max_organizations} Institutions";
    }

    /**
     * Get price in minor units (cents) for a given billing interval.
     */
    public function priceForInterval(string $interval = 'monthly'): int
    {
        $normalized = strtolower($interval);

        if (in_array($normalized, ['annual', 'yearly', 'year'], true)) {
            if ($this->price_annual_cents > 0) {
                return (int) $this->price_annual_cents;
            }

            // Fallback: 10 months billed for 12 months (2 months free)
            return (int) ($this->price_cents * 10);
        }

        return (int) $this->price_cents;
    }

    /**
     * Formatted price in USD for presentation.
     */
    public function formattedPrice(string $interval = 'monthly'): string
    {
        if ($this->isCustomPricing()) {
            return 'Custom';
        }

        $cents = $this->priceForInterval($interval);
        $dollars = (int) ($cents / 100);

        return "\${$dollars}";
    }

    /**
     * Determine if plan is custom enterprise pricing.
     */
    public function isCustomPricing(): bool
    {
        return $this->price_cents <= 0 && $this->price_annual_cents <= 0 && $this->isUnlimitedOrganizations();
    }

    /**
     * Calculate annual savings compared to 12 monthly charges.
     */
    public function annualSavingsCents(): int
    {
        if ($this->isCustomPricing() || $this->price_cents <= 0) {
            return 0;
        }

        $twelveMonthsMonthly = $this->price_cents * 12;
        $annualPrice = $this->priceForInterval('annual');

        return max(0, $twelveMonthsMonthly - $annualPrice);
    }
}
