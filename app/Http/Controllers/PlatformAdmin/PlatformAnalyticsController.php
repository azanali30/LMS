<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\PaymentApprovalRequest;
use App\Models\SubscriptionInvoice;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Services\TenantContext;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAnalyticsController extends Controller
{
    /**
     * Display deep platform analytics and SaaS reporting.
     */
    public function index(): Response
    {
        return TenantContext::bypass(function () {
            // 1. Monthly User & Organization Growth (Last 12 Months)
            $growthHistory = [];
            for ($i = 11; $i >= 0; $i--) {
                $monthDate = Carbon::now()->subMonths($i);
                $usersCount = User::whereYear('created_at', $monthDate->year)
                    ->whereMonth('created_at', $monthDate->month)
                    ->count();

                $orgsCount = Organization::whereYear('created_at', $monthDate->year)
                    ->whereMonth('created_at', $monthDate->month)
                    ->count();

                $revenueCents = SubscriptionInvoice::where('status', 'paid')
                    ->whereYear('paid_at', $monthDate->year)
                    ->whereMonth('paid_at', $monthDate->month)
                    ->sum('amount_cents');

                $growthHistory[] = [
                    'label' => $monthDate->format('M Y'),
                    'users' => $usersCount,
                    'organizations' => $orgsCount,
                    'revenue_cents' => $revenueCents,
                    'revenue_formatted' => '$' . number_format($revenueCents / 100, 2),
                ];
            }

            // 2. Organization Types Breakdown
            $typesBreakdown = Organization::selectRaw('organization_type, count(*) as count')
                ->groupBy('organization_type')
                ->get()
                ->map(fn ($item) => [
                    'type' => ucfirst(str_replace('_', ' ', $item->organization_type ?: 'school')),
                    'count' => $item->count,
                ]);

            // 3. Subscription Status Distribution
            $subscriptionStatuses = OrganizationSubscription::selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->get()
                ->map(fn ($item) => [
                    'status' => ucfirst($item->status),
                    'count' => $item->count,
                ]);

            // 4. Payment Approval Rates
            $totalPaymentRequests = PaymentApprovalRequest::count();
            $approvedPaymentRequests = PaymentApprovalRequest::where('status', 'approved')->count();
            $rejectedPaymentRequests = PaymentApprovalRequest::where('status', 'rejected')->count();
            $pendingPaymentRequests = PaymentApprovalRequest::where('status', 'pending')->count();

            $approvalRate = $totalPaymentRequests > 0
                ? round(($approvedPaymentRequests / $totalPaymentRequests) * 100, 1)
                : 100.0;

            // 5. Plan Distribution
            $plansPopularity = SubscriptionPlan::withCount('subscriptions')
                ->where('is_active', true)
                ->get()
                ->map(fn ($plan) => [
                    'name' => $plan->name,
                    'count' => $plan->subscriptions_count,
                ]);

            return Inertia::render('platform-admin/analytics/index', [
                'growthHistory' => $growthHistory,
                'typesBreakdown' => $typesBreakdown,
                'subscriptionStatuses' => $subscriptionStatuses,
                'paymentStats' => [
                    'total' => $totalPaymentRequests,
                    'approved' => $approvedPaymentRequests,
                    'rejected' => $rejectedPaymentRequests,
                    'pending' => $pendingPaymentRequests,
                    'approvalRate' => $approvalRate,
                ],
                'plansPopularity' => $plansPopularity,
            ]);
        });
    }
}
