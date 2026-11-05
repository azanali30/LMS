<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\PlatformAuditLog;
use App\Models\SubscriptionPlan;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformOrganizationController extends Controller
{
    /**
     * Display list of all platform institutions / organizations.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
            $search = $request->query('search');
            $status = $request->query('status');
            $type = $request->query('type');
            $planId = $request->query('plan_id');

            $query = Organization::with(['creator', 'subscription.plan'])
                ->withCount([
                    'members',
                    'members as teachers_count' => fn ($q) => $q->where('organization_user.role', 'teacher'),
                    'members as students_count' => fn ($q) => $q->where('organization_user.role', 'student'),
                    'courses',
                ])
                ->latest();

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($status && in_array($status, ['active', 'suspended'], true)) {
                $query->where('status', $status);
            }

            if ($type) {
                $query->where('organization_type', $type);
            }

            if ($planId) {
                $query->whereHas('subscription', function ($q) use ($planId) {
                    $q->where('plan_id', $planId);
                });
            }

            $organizations = $query->paginate(15)->withQueryString()->through(function (Organization $org) {
                return [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'organization_type' => $org->organization_type,
                    'status' => $org->status,
                    'email' => $org->email,
                    'phone' => $org->phone,
                    'creator' => $org->creator ? [
                        'id' => $org->creator->id,
                        'name' => $org->creator->name,
                        'email' => $org->creator->email,
                    ] : null,
                    'subscription' => $org->subscription ? [
                        'status' => $org->subscription->status,
                        'plan_name' => $org->subscription->plan?->name ?? 'Custom',
                        'billing_interval' => $org->subscription->billing_interval,
                        'ends_at' => $org->subscription->ends_at?->format('M d, Y'),
                    ] : null,
                    'teachers_count' => $org->teachers_count,
                    'students_count' => $org->students_count,
                    'courses_count' => $org->courses_count,
                    'created_at' => $org->created_at->format('M d, Y'),
                    'subdomain_url' => rescue(fn () => $org->subdomainUrl(), url('/'), false),
                ];
            });

            $plans = SubscriptionPlan::where('is_active', true)->get(['id', 'name', 'slug']);

            $counts = [
                'all' => Organization::count(),
                'active' => Organization::where('status', 'active')->count(),
                'suspended' => Organization::where('status', 'suspended')->count(),
            ];

            return Inertia::render('platform-admin/organizations/index', [
                'organizations' => $organizations,
                'plans' => $plans,
                'counts' => $counts,
                'filters' => [
                    'search' => $search,
                    'status' => $status,
                    'type' => $type,
                    'plan_id' => $planId,
                ],
            ]);
        });
    }

    /**
     * Show detailed view of a specific organization.
     */
    public function show(int $id): Response
    {
        return TenantContext::bypass(function () use ($id) {
            $org = Organization::with([
                'creator',
                'subscription.plan',
                'members' => fn ($q) => $q->take(50),
                'subscriptionInvoices' => fn ($q) => $q->latest()->take(10),
            ])
            ->withCount(['members', 'courses', 'schoolClasses', 'classSections'])
            ->findOrFail($id);

            $availablePlans = SubscriptionPlan::where('is_active', true)->get();

            $auditLogs = PlatformAuditLog::where('target_type', Organization::class)
                ->where('target_id', $org->id)
                ->with('user')
                ->latest()
                ->take(15)
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user_name' => $log->user?->name ?? 'System',
                    'details' => $log->details,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->format('M d, Y h:i A'),
                ]);

            return Inertia::render('platform-admin/organizations/show', [
                'organization' => [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'organization_type' => $org->organization_type,
                    'status' => $org->status,
                    'email' => $org->email,
                    'phone' => $org->phone,
                    'address' => $org->address,
                    'timezone' => $org->timezone,
                    'currency' => $org->currency,
                    'creator' => $org->creator ? [
                        'id' => $org->creator->id,
                        'name' => $org->creator->name,
                        'email' => $org->creator->email,
                    ] : null,
                    'subscription' => $org->subscription ? [
                        'id' => $org->subscription->id,
                        'status' => $org->subscription->status,
                        'plan_id' => $org->subscription->plan_id,
                        'plan_name' => $org->subscription->plan?->name ?? 'Custom',
                        'billing_interval' => $org->subscription->billing_interval,
                        'starts_at' => $org->subscription->starts_at?->format('M d, Y'),
                        'trial_ends_at' => $org->subscription->trial_ends_at?->format('M d, Y'),
                        'ends_at' => $org->subscription->ends_at?->format('M d, Y'),
                    ] : null,
                    'metrics' => [
                        'members_count' => $org->members_count,
                        'courses_count' => $org->courses_count,
                        'classes_count' => $org->school_classes_count,
                        'sections_count' => $org->class_sections_count,
                    ],
                    'created_at' => $org->created_at->format('M d, Y h:i A'),
                    'subdomain_url' => rescue(fn () => $org->subdomainUrl(), url('/'), false),
                ],
                'members' => $org->members->map(fn ($m) => [
                    'id' => $m->id,
                    'name' => $m->name,
                    'email' => $m->email,
                    'role' => $m->pivot->role,
                    'title' => $m->pivot->title,
                    'status' => $m->pivot->status,
                ]),
                'invoices' => $org->subscriptionInvoices->map(fn ($inv) => [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'amount_cents' => $inv->amount_cents,
                    'amount_formatted' => '$' . number_format($inv->amount_cents / 100, 2),
                    'status' => $inv->status,
                    'due_date' => $inv->due_date?->format('M d, Y'),
                    'paid_at' => $inv->paid_at?->format('M d, Y'),
                ]),
                'availablePlans' => $availablePlans,
                'auditLogs' => $auditLogs,
            ]);
        });
    }

    /**
     * Suspend or Reactivate an organization.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $validated = $request->validate([
                'status' => ['required', 'string', 'in:active,suspended'],
                'reason' => ['nullable', 'string', 'max:500'],
            ]);

            $org = Organization::findOrFail($id);
            $previousStatus = $org->status;
            $newStatus = $validated['status'];

            $org->update(['status' => $newStatus]);

            PlatformAuditLog::record(
                action: $newStatus === 'suspended' ? 'organization.suspended' : 'organization.activated',
                target: $org,
                details: [
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'reason' => $validated['reason'] ?? null,
                ],
                request: $request
            );

            $msg = $newStatus === 'suspended'
                ? "Organization '{$org->name}' has been suspended."
                : "Organization '{$org->name}' has been reactivated.";

            return back()->with('success', $msg);
        });
    }

    /**
     * Change or assign a subscription plan to an organization.
     */
    public function changePlan(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $validated = $request->validate([
                'plan_id' => ['required', 'exists:subscription_plans,id'],
                'billing_interval' => ['required', 'in:monthly,annual'],
                'status' => ['required', 'in:active,trialing,past_due,cancelled'],
            ]);

            $org = Organization::findOrFail($id);
            $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

            $sub = $org->subscription;

            if ($sub) {
                $previousPlanId = $sub->plan_id;
                $sub->update([
                    'plan_id' => $plan->id,
                    'billing_interval' => $validated['billing_interval'],
                    'status' => $validated['status'],
                ]);
            } else {
                $previousPlanId = null;
                $sub = OrganizationSubscription::create([
                    'organization_id' => $org->id,
                    'plan_id' => $plan->id,
                    'user_id' => $org->created_by,
                    'billing_interval' => $validated['billing_interval'],
                    'status' => $validated['status'],
                    'starts_at' => now(),
                    'trial_ends_at' => now()->addDays(30),
                ]);
            }

            PlatformAuditLog::record(
                action: 'organization.plan_changed',
                target: $org,
                details: [
                    'previous_plan_id' => $previousPlanId,
                    'new_plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'billing_interval' => $validated['billing_interval'],
                    'status' => $validated['status'],
                ],
                request: $request
            );

            return back()->with('success', "Subscription plan for '{$org->name}' updated to {$plan->name}.");
        });
    }
}

