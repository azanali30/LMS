<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\OrganizationUser;
use App\Models\PaymentApprovalRequest;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\SupportTicket;
use App\Models\User;
use App\Services\TenantContext;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PlatformDashboardController extends Controller
{
    /**
     * Render the comprehensive Super Admin Platform Dashboard.
     */
    public function index(): Response
    {
        return TenantContext::bypass(function () {
            // 1. Organization KPIs
            $totalOrganizations = Organization::count();
            $activeOrganizations = Organization::where('status', 'active')->count();
            $trialOrganizations = OrganizationSubscription::where('status', 'trialing')->count();
            $suspendedOrganizations = Organization::where('status', 'suspended')->count();

            // 2. User KPIs
            $totalUsers = User::count();
            $totalStudents = OrganizationUser::where('role', 'student')->distinct('user_id')->count('user_id');
            $totalTeachers = OrganizationUser::where('role', 'teacher')->distinct('user_id')->count('user_id');
            $totalOwners = OrganizationUser::where('role', 'owner')->distinct('user_id')->count('user_id');

            // 3. Subscription & Revenue KPIs
            $activeSubscriptions = OrganizationSubscription::whereIn('status', ['active', 'trialing'])->count();
            $expiringSubscriptions = OrganizationSubscription::whereNotNull('ends_at')
                ->where('ends_at', '<=', now()->addDays(7))
                ->where('ends_at', '>=', now())
                ->count();

            // Calculate Monthly Recurring Revenue (MRR) from active paid subscriptions
            $subscriptions = OrganizationSubscription::with('plan')
                ->where('status', 'active')
                ->get();

            $mrrCents = $subscriptions->sum(function (OrganizationSubscription $sub) {
                if (! $sub->plan) return 0;
                if ($sub->billing_interval === 'annual' && $sub->plan->price_annual_cents > 0) {
                    return (int) round($sub->plan->price_annual_cents / 12);
                }
                return (int) ($sub->plan->price_cents ?? 0);
            });

            $totalRevenueCents = SubscriptionInvoice::where('status', 'paid')->sum('amount_cents');
            $pendingPayments = PaymentApprovalRequest::where('status', PaymentApprovalRequest::STATUS_PENDING)->count();
            $pendingInvoices = SubscriptionInvoice::where('status', 'pending')->count();
            $openTickets = SupportTicket::whereIn('status', ['open', 'in_progress', 'waiting_response'])->count();

            // 4. Recent Organizations
            $recentOrganizations = Organization::with(['creator', 'subscription.plan'])
                ->withCount(['members', 'courses'])
                ->latest()
                ->take(6)
                ->get()
                ->map(fn (Organization $org) => [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'organization_type' => $org->organization_type,
                    'status' => $org->status,
                    'creator_name' => $org->creator?->name ?? 'Platform',
                    'creator_email' => $org->creator?->email ?? $org->email,
                    'plan_name' => $org->subscription?->plan?->name ?? 'Trial/Unassigned',
                    'members_count' => $org->members_count,
                    'created_at' => $org->created_at->format('M d, Y'),
                ]);

            // 5. Recent Registered Users
            $recentUsers = User::latest()
                ->take(6)
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status ?? 'active',
                    'email_verified' => $user->hasVerifiedEmail(),
                    'created_at' => $user->created_at->format('M d, Y'),
                ]);

            // 6. Recent Payment Approvals
            $recentPaymentRequests = PaymentApprovalRequest::latest()
                ->take(5)
                ->get()
                ->map(fn (PaymentApprovalRequest $req) => [
                    'id' => $req->id,
                    'email' => $req->email,
                    'plan_name' => $req->planDisplayName(),
                    'amount_formatted' => $req->formattedAmount(),
                    'payment_method' => $req->payment_method,
                    'status' => $req->status,
                    'transaction_reference' => $req->transaction_reference,
                    'created_at' => $req->created_at->format('M d, Y h:i A'),
                ]);

            // 7. Monthly Registrations Trend (Last 6 Months)
            $monthlyRegistrations = [];
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = Carbon::now()->subMonths($i);
                $count = User::whereYear('created_at', $monthDate->year)
                    ->whereMonth('created_at', $monthDate->month)
                    ->count();
                $monthlyRegistrations[] = [
                    'month' => $monthDate->format('M Y'),
                    'count' => $count,
                ];
            }

            // 8. Plan Distribution
            $plansDistribution = SubscriptionPlan::withCount(['subscriptions' => function ($q) {
                $q->whereIn('status', ['active', 'trialing']);
            }])
                ->where('is_active', true)
                ->get()
                ->map(fn (SubscriptionPlan $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'subscribers_count' => $p->subscriptions_count,
                ]);

            return Inertia::render('platform-admin/dashboard', [
                'metrics' => [
                    'totalOrganizations' => $totalOrganizations,
                    'activeOrganizations' => $activeOrganizations,
                    'trialOrganizations' => $trialOrganizations,
                    'suspendedOrganizations' => $suspendedOrganizations,
                    'totalUsers' => $totalUsers,
                    'totalStudents' => $totalStudents,
                    'totalTeachers' => $totalTeachers,
                    'totalOwners' => $totalOwners,
                    'activeSubscriptions' => $activeSubscriptions,
                    'expiringSubscriptions' => $expiringSubscriptions,
                    'mrrFormatted' => '$' . number_format($mrrCents / 100, 2),
                    'totalRevenueFormatted' => '$' . number_format($totalRevenueCents / 100, 2),
                    'pendingPayments' => $pendingPayments,
                    'pendingInvoices' => $pendingInvoices,
                    'openTickets' => $openTickets,
                ],
                'recentOrganizations' => $recentOrganizations,
                'recentUsers' => $recentUsers,
                'recentPaymentRequests' => $recentPaymentRequests,
                'monthlyRegistrations' => $monthlyRegistrations,
                'plansDistribution' => $plansDistribution,
            ]);
        });
    }
}
