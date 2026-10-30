<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'tenant' => fn () => \App\Services\TenantContext::current() ? [
                'id' => \App\Services\TenantContext::current()->id,
                'name' => \App\Services\TenantContext::current()->name,
                'slug' => \App\Services\TenantContext::current()->slug,
                'organization_type' => \App\Services\TenantContext::current()->organization_type,
                'logo_path' => \App\Services\TenantContext::current()->logo_path,
                'primary_color' => \App\Services\TenantContext::current()->primary_color,
                'accent_color' => \App\Services\TenantContext::current()->accent_color,
                'status' => \App\Services\TenantContext::current()->status,
                'subdomain_url' => \App\Services\TenantContext::current()->subdomainUrl(),
            ] : null,
            'auth' => [
                'user' => $user,
                'currentOrganization' => fn () => \App\Services\TenantContext::current(),
                'userOrganizations' => fn () => $user
                    ? $user->organizations()
                        ->where('organizations.status', 'active')
                        ->wherePivot('status', 'active')
                        ->withPivot('role', 'title', 'status')
                        ->get(['organizations.id', 'organizations.name', 'organizations.slug', 'organizations.organization_type', 'organizations.status'])
                    : [],
                'organizationRole' => fn () => \App\Services\TenantContext::currentRole($user),
                'isSuperAdmin' => fn () => \App\Services\TenantContext::isSuperAdmin($user),
                'canCreateOrganization' => fn () => $user ? $user->canCreateOrganization() : false,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => fn () => $user ? [
                'unreadCount' => $user->unreadNotifications()->count(),
                'recent' => $user->notifications()->take(10)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'type' => $n->type,
                    'data' => $n->data,
                    'read_at' => $n->read_at ? $n->read_at->toIso8601String() : null,
                    'created_at' => $n->created_at->diffForHumans(),
                ]),
            ] : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
