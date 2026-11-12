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
            'tenant' => fn () => rescue(function () {
                $tenant = \App\Services\TenantContext::current();
                return $tenant ? [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'organization_type' => $tenant->organization_type,
                    'logo_path' => $tenant->logo_path,
                    'primary_color' => $tenant->primary_color,
                    'accent_color' => $tenant->accent_color,
                    'status' => $tenant->status,
                    'subdomain_url' => rescue(fn () => $tenant->subdomainUrl(), url('/'), false),
                ] : null;
            }, null, false),
            'auth' => [
                'user' => $user,
                'currentOrganization' => fn () => rescue(fn () => \App\Services\TenantContext::current(), null, false),
                'userOrganizations' => fn () => $user ? (
                    $user->relationLoaded('organizations')
                        ? $user->getRelation('organizations')
                        : rescue(fn () => $user->organizations()
                            ->where('organizations.status', 'active')
                            ->wherePivot('status', 'active')
                            ->withPivot('role', 'title', 'status')
                            ->get(['organizations.id', 'organizations.name', 'organizations.slug', 'organizations.organization_type', 'organizations.status']), [], false)
                ) : [],
                'organizationRole' => fn () => rescue(fn () => \App\Services\TenantContext::currentRole($user), null, false),
                'isSuperAdmin' => fn () => rescue(fn () => \App\Services\TenantContext::isSuperAdmin($user), false, false),
                'canCreateOrganization' => fn () => $user ? rescue(fn () => $user->canCreateOrganization(), true, false) : false,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => fn () => $user ? rescue(function () use ($user) {
                return [
                    'unreadCount' => $user->unreadNotifications()->count(),
                    'recent' => $user->notifications()->take(10)->get()->map(fn ($n) => [
                        'id' => $n->id,
                        'type' => $n->type,
                        'data' => $n->data,
                        'read_at' => $n->read_at ? $n->read_at->toIso8601String() : null,
                        'created_at' => $n->created_at ? $n->created_at->diffForHumans() : '',
                    ]),
                ];
            }, fn () => [
                'unreadCount' => 0,
                'recent' => [],
            ], false) : null,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
