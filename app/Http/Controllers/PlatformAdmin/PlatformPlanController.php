<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Models\SubscriptionPlan;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformPlanController extends Controller
{
    /**
     * Display SaaS pricing plans management.
     */
    public function index(): Response
    {
        return TenantContext::bypass(function () {
            $plans = SubscriptionPlan::withCount(['subscriptions' => function ($q) {
                $q->whereIn('status', ['active', 'trialing']);
            }])
                ->get()
                ->map(fn (SubscriptionPlan $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'description' => $p->description,
                    'price_cents' => $p->price_cents,
                    'price_annual_cents' => $p->price_annual_cents,
                    'price_monthly_formatted' => '$' . number_format($p->price_cents / 100, 2),
                    'price_annual_formatted' => '$' . number_format($p->price_annual_cents / 100, 2),
                    'currency' => $p->currency,
                    'billing_interval' => $p->billing_interval,
                    'max_organizations' => $p->max_organizations,
                    'features' => $p->features ?? [],
                    'is_active' => (bool) $p->is_active,
                    'active_subscribers_count' => $p->subscriptions_count,
                ]);

            return Inertia::render('platform-admin/plans/index', [
                'plans' => $plans,
            ]);
        });
    }

    /**
     * Create a new subscription plan.
     */
    public function store(Request $request): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request) {
            $validated = $request->validate([
                'name' => ['required', 'string', 'max:100'],
                'slug' => ['required', 'string', 'max:50', 'alpha_dash', 'unique:subscription_plans,slug'],
                'description' => ['nullable', 'string', 'max:500'],
                'price_cents' => ['required', 'integer', 'min:0'],
                'price_annual_cents' => ['required', 'integer', 'min:0'],
                'max_organizations' => ['nullable', 'integer', 'min:0'],
                'features' => ['nullable', 'array'],
                'features.*' => ['string', 'max:255'],
                'is_active' => ['boolean'],
            ]);

            $plan = SubscriptionPlan::create([
                'name' => $validated['name'],
                'slug' => strtolower($validated['slug']),
                'description' => $validated['description'] ?? null,
                'price_cents' => $validated['price_cents'],
                'price_annual_cents' => $validated['price_annual_cents'],
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => $validated['max_organizations'] ?? null,
                'features' => $validated['features'] ?? [],
                'is_active' => $request->boolean('is_active', true),
            ]);

            PlatformAuditLog::record(
                action: 'plan.created',
                target: $plan,
                details: ['name' => $plan->name, 'slug' => $plan->slug],
                request: $request
            );

            return back()->with('success', "Plan '{$plan->name}' created successfully.");
        });
    }

    /**
     * Update an existing plan.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $plan = SubscriptionPlan::findOrFail($id);

            $validated = $request->validate([
                'name' => ['required', 'string', 'max:100'],
                'description' => ['nullable', 'string', 'max:500'],
                'price_cents' => ['required', 'integer', 'min:0'],
                'price_annual_cents' => ['required', 'integer', 'min:0'],
                'max_organizations' => ['nullable', 'integer', 'min:0'],
                'features' => ['nullable', 'array'],
                'features.*' => ['string', 'max:255'],
                'is_active' => ['boolean'],
            ]);

            $plan->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'price_cents' => $validated['price_cents'],
                'price_annual_cents' => $validated['price_annual_cents'],
                'max_organizations' => $validated['max_organizations'] ?? null,
                'features' => $validated['features'] ?? [],
                'is_active' => $request->boolean('is_active'),
            ]);

            PlatformAuditLog::record(
                action: 'plan.updated',
                target: $plan,
                details: ['name' => $plan->name, 'slug' => $plan->slug],
                request: $request
            );

            return back()->with('success', "Plan '{$plan->name}' updated successfully.");
        });
    }

    /**
     * Toggle plan active state.
     */
    public function toggle(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $plan = SubscriptionPlan::findOrFail($id);
            $plan->update(['is_active' => ! $plan->is_active]);

            PlatformAuditLog::record(
                action: $plan->is_active ? 'plan.activated' : 'plan.deactivated',
                target: $plan,
                details: ['name' => $plan->name, 'slug' => $plan->slug],
                request: $request
            );

            $statusText = $plan->is_active ? 'activated' : 'deactivated';
            return back()->with('success', "Plan '{$plan->name}' has been {$statusText}.");
        });
    }
}
