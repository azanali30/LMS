<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireOrganizationRole
{
    /**
     * Handle an incoming request.
     *
     * @param string ...$roles Allowed organization roles (e.g. 'owner', 'admin', 'teacher')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if (! TenantContext::check()) {
            return redirect()->route('organizations.create')
                ->with('warning', 'Please create or join an organization to continue.');
        }

        if (! TenantContext::hasRole($roles, $user)) {
            abort(403, 'You do not have permission to access this resource within this organization.');
        }

        return $next($request);
    }
}
