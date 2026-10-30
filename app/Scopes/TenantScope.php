<?php

namespace App\Scopes;

use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (TenantContext::isBypassed()) {
            return;
        }

        if ($tenantId = TenantContext::id()) {
            $builder->where($model->qualifyColumn('organization_id'), '=', $tenantId);
        }
    }
}
