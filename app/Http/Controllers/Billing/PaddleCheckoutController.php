<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\SubscriptionPlan;
use App\Services\PaddleService;
use App\Tenant\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaddleCheckoutController extends Controller
{
    public function __construct(
        protected PaddleService $paddleService
    ) {}

    /**
     * Generate secure, validated parameters for launching a Paddle.js checkout.
     */
    public function initiate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_slug' => 'required|string',
            'interval' => 'nullable|string|in:monthly,annual',
            'organization_id' => 'nullable|integer',
        ]);

        $user = $request->user();
        if (! $user) {
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        // Resolve Organization from TenantContext or request
        $organization = null;
        if (! empty($validated['organization_id'])) {
            $organization = Organization::find($validated['organization_id']);
        } elseif (TenantContext::check()) {
            $organization = TenantContext::get();
        } else {
            $organization = $user->organizations()->first();
        }

        if (! $organization) {
            return response()->json(['error' => 'No active organization found to subscribe.'], 404);
        }

        // Verify permission: user must be owner or admin of organization, or super_admin
        $isOwnerOrAdmin = $organization->created_by === $user->id
            || $organization->members()->where('users.id', $user->id)->wherePivotIn('role', ['admin', 'owner'])->exists()
            || ($user->role === 'super_admin');

        if (! $isOwnerOrAdmin) {
            return response()->json(['error' => 'Unauthorized. Only organization owners and administrators can manage subscriptions.'], 403);
        }

        // Resolve Subscription Plan
        $plan = SubscriptionPlan::findBySlug($validated['plan_slug']);
        if (! $plan) {
            return response()->json(['error' => 'Invalid or inactive subscription plan selected.'], 404);
        }

        if ($plan->isCustomPricing()) {
            return response()->json([
                'is_custom' => true,
                'message' => 'The selected plan requires bespoke enterprise onboarding. Please contact our sales team.',
                'contact_url' => '/contact?subject=Enterprise+Inquiry',
            ], 200);
        }

        $interval = $validated['interval'] ?? 'monthly';
        $checkoutParams = $this->paddleService->buildCheckoutParameters(
            $organization,
            $user,
            $plan,
            $interval
        );

        return response()->json([
            'status' => 'success',
            'checkout' => $checkoutParams,
        ], 200);
    }
}

