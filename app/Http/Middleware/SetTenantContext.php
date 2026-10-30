<?php

namespace App\Http\Middleware;

use App\Models\Organization;
use App\Services\TenantContext;
use App\Services\TenantResolver;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class SetTenantContext
{
    public function __construct(
        protected TenantResolver $tenantResolver
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        // 1. Resolve school organization from request hostname / subdomain / header
        $subdomainOrg = $this->tenantResolver->resolveFromRequest($request);

        if ($subdomainOrg) {
            // Established organization context from school subdomain
            TenantContext::set($subdomainOrg);

            if ($user) {
                // Verify user has active membership in this specific organization or is super admin
                $isMember = $user->organizations()
                    ->where('organizations.id', $subdomainOrg->id)
                    ->where('organizations.status', 'active')
                    ->wherePivot('status', 'active')
                    ->exists();

                if ($isMember || $user->isSuperAdmin()) {
                    $request->session()->put('current_organization_id', $subdomainOrg->id);
                } else {
                    // Context is NOT authorization: authenticated user does not belong to this school
                    TenantContext::set(null);
                    $request->session()->forget('current_organization_id');

                    // Allow logout and public assets without trapping user in a 403 loop
                    if ($request->is('logout') || $request->is('api/health')) {
                        return $next($request);
                    }

                    // For any protected or tenant-scoped route, reject unauthorized cross-tenant attempt
                    if ($request->is('dashboard*', 'school*', 'learning*', 'organizations*') || $request->routeIs('dashboard', 'school.*', 'learning.*', 'organizations.*')) {
                        abort(403, "Access denied. Your account ({$user->email}) is not an active member of {$subdomainOrg->name}.");
                    }

                    // If hitting login or general page while logged into another school, redirect or log out
                    Auth::logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    return redirect()->route('login')
                        ->withErrors(['email' => "Your account is not an active member of {$subdomainOrg->name}."]);
                }
            }
        } else {
            // Central platform domain (marketing, super admin, or user hub)
            $organization = null;

            if ($user) {
                // 1. Check if route has an organization model binding or slug (e.g. org switch)
                if ($orgParam = $request->route('organization')) {
                    if ($orgParam instanceof Organization) {
                        $organization = $orgParam;
                    } elseif (is_numeric($orgParam)) {
                        $organization = Organization::find($orgParam);
                    } else {
                        $organization = Organization::where('slug', $orgParam)->first();
                    }
                }

                // 2. Check session if not found from route
                if (! $organization && $sessionOrgId = $request->session()->get('current_organization_id')) {
                    $organization = Organization::where('id', $sessionOrgId)->where('status', 'active')->first();
                }

                // 3. Fallback to user's first active organization
                if (! $organization) {
                    $organization = $user->organizations()
                        ->where('organizations.status', 'active')
                        ->wherePivot('status', 'active')
                        ->first();
                }

                // 4. Verify membership permission
                if ($organization && $organization->status === 'active') {
                    $isMember = $user->organizations()
                        ->where('organizations.id', $organization->id)
                        ->where('organizations.status', 'active')
                        ->wherePivot('status', 'active')
                        ->exists();

                    if ($isMember || $user->isSuperAdmin()) {
                        TenantContext::set($organization);
                        $request->session()->put('current_organization_id', $organization->id);
                    } else {
                        TenantContext::set(null);
                        $request->session()->forget('current_organization_id');
                    }
                } else {
                    TenantContext::set(null);
                    $request->session()->forget('current_organization_id');
                }
            } else {
                TenantContext::set(null);
            }
        }

        // Share tenant data with Inertia for both guests (e.g. school login) and authenticated users
        $currentOrg = TenantContext::current();

        Inertia::share([
            'tenant' => fn () => rescue(function () use ($currentOrg) {
                return $currentOrg ? [
                    'id' => $currentOrg->id,
                    'name' => $currentOrg->name,
                    'slug' => $currentOrg->slug,
                    'organization_type' => $currentOrg->organization_type,
                    'logo_path' => $currentOrg->logo_path,
                    'primary_color' => $currentOrg->primary_color,
                    'accent_color' => $currentOrg->accent_color,
                    'status' => $currentOrg->status,
                    'subdomain_url' => rescue(fn () => $currentOrg->subdomainUrl(), url('/'), false),
                ] : null;
            }, null, false),
            'currentOrganization' => fn () => rescue(fn () => $currentOrg?->only([
                'id', 'name', 'slug', 'organization_type', 'logo_path', 'primary_color', 'accent_color', 'timezone', 'status',
            ]), null, false),
            'currentRole' => fn () => rescue(fn () => TenantContext::currentRole($user), null, false),
            'tenantSubscription' => fn () => rescue(function () use ($currentOrg) {
                $sub = $currentOrg?->subscription;
                return $sub ? [
                    'status' => $sub->status,
                    'has_access' => (bool) $sub->hasAccess(),
                    'is_trialing' => (bool) $sub->isTrialing(),
                    'is_expired' => (bool) $sub->isTrialExpired(),
                    'days_remaining' => (int) $sub->daysRemainingInTrial(),
                ] : null;
            }, null, false),
            'userOrganizations' => fn () => $user ? rescue(fn () => $user->organizations()
                ->where('organizations.status', 'active')
                ->wherePivot('status', 'active')
                ->withPivot('role', 'title', 'status')
                ->get(['organizations.id', 'organizations.name', 'organizations.slug', 'organizations.organization_type', 'organizations.status']), [], false) : [],
        ]);

        // Enforce subscription access and configured expiry policy (read-only vs locked)
        if ($currentOrg && $user && ! $user->isSuperAdmin()) {
            $subscription = rescue(fn () => $currentOrg->subscription, null, false);
            if ($subscription && ! $subscription->hasAccess()) {
                $policy = config('billing.expiry_policy', 'read_only');

                $isExemptRoute = $request->is(
                    'organizations/billing*',
                    'admin/subscriptions*',
                    'organizations/*/switch',
                    'logout',
                    'api/health',
                    'email/*'
                ) || $request->routeIs('organizations.billing.*', 'organizations.switch', 'logout');

                if (! $isExemptRoute) {
                    if ($policy === 'read_only') {
                        // In read_only mode, inspection (GET, HEAD, OPTIONS) is permitted, but state modifications are blocked
                        if (! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
                            abort(403, 'Subscription trial expired. Your school workspace is currently in read-only mode. Please renew your subscription to resume administrative modifications.');
                        }
                    } elseif ($policy === 'locked') {
                        // In locked mode, all school workspace operations are locked pending subscription payment
                        abort(403, 'Subscription trial expired. Your school workspace is locked. Please renew your subscription to resume access.');
                    }
                }
            }
        }

        return $next($request);
    }
}
