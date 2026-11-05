<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationSubscription;
use App\Models\PlatformAuditLog;
use App\Models\SubscriptionPlan;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSubscriptionController extends Controller
{
    /**
     * List all platform subscriptions.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
            $status = $request->query('status');
            $planId = $request->query('plan_id');
            $interval = $request->query('interval');
            $search = $request->query('search');

            $query = OrganizationSubscription::with(['organization', 'plan', 'user'])
                ->latest();

            if ($status) {
                if (in_array($status, ['trial', 'trialing'], true)) {
                    $query->whereIn('status', ['trial', 'trialing']);
                } else {
                    $query->where('status', $status);
                }
            }

            if ($planId) {
                $query->where('plan_id', $planId);
            }

            if ($interval) {
                $query->where('billing_interval', $interval);
            }

            if ($search) {
                $query->whereHas('organization', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            }

            $subscriptions = $query->paginate(15)->withQueryString()->through(function (OrganizationSubscription $sub) {
                return [
                    'id' => $sub->id,
                    'organization' => $sub->organization ? [
                        'id' => $sub->organization->id,
                        'name' => $sub->organization->name,
                        'slug' => $sub->organization->slug,
                    ] : null,
                    'plan' => $sub->plan ? [
                        'id' => $sub->plan->id,
                        'name' => $sub->plan->name,
                        'slug' => $sub->plan->slug,
                        'price_formatted' => $sub->plan->formattedPrice($sub->billing_interval),
                    ] : null,
                    'user' => $sub->user ? [
                        'id' => $sub->user->id,
                        'name' => $sub->user->name,
                        'email' => $sub->user->email,
                    ] : null,
                    'status' => $sub->status,
                    'billing_interval' => $sub->billing_interval,
                    'starts_at' => $sub->starts_at?->format('M d, Y'),
                    'trial_ends_at' => $sub->trial_ends_at?->format('M d, Y'),
                    'ends_at' => $sub->ends_at?->format('M d, Y'),
                    'cancelled_at' => $sub->cancelled_at?->format('M d, Y'),
                ];
            });

            $plans = SubscriptionPlan::where('is_active', true)->get(['id', 'name', 'slug']);

            $counts = [
                'all' => OrganizationSubscription::count(),
                'active' => OrganizationSubscription::where('status', 'active')->count(),
                'trialing' => OrganizationSubscription::whereIn('status', ['trial', 'trialing'])->count(),
                'cancelled' => OrganizationSubscription::where('status', 'cancelled')->count(),
            ];

            return Inertia::render('platform-admin/subscriptions/index', [
                'subscriptions' => $subscriptions,
                'plans' => $plans,
                'counts' => $counts,
                'filters' => [
                    'status' => $status,
                    'plan_id' => $planId,
                    'interval' => $interval,
                    'search' => $search,
                ],
            ]);
        });
    }

    /**
     * Cancel an active subscription.
     */
    public function cancel(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $sub = OrganizationSubscription::with('organization')->findOrFail($id);

            $sub->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            PlatformAuditLog::record(
                action: 'subscription.cancelled',
                target: $sub,
                details: [
                    'organization_id' => $sub->organization_id,
                    'organization_name' => $sub->organization?->name,
                    'plan_id' => $sub->plan_id,
                ],
                request: $request
            );

            return back()->with('success', "Subscription for '{$sub->organization?->name}' has been cancelled.");
        });
    }
}

