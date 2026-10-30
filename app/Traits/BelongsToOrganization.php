<?php

namespace App\Traits;

use App\Models\Organization;
use App\Scopes\TenantScope;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToOrganization
{
    /**
     * Boot the BelongsToOrganization trait.
     */
    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function ($model): void {
            if (empty($model->organization_id) && ($tenantId = TenantContext::id())) {
                $model->organization_id = $tenantId;
            }
        });
    }

    /**
     * The organization that owns this record.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Scope a query to only include records of a specific organization.
     */
    public function scopeForOrganization(Builder $query, int $organizationId): Builder
    {
        return $query->withoutGlobalScope(TenantScope::class)
            ->where($this->qualifyColumn('organization_id'), $organizationId);
    }

    /**
     * Scope a query to bypass tenant scoping.
     */
    public function scopeWithoutTenantScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope(TenantScope::class);
    }
}
