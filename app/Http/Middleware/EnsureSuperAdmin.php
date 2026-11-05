<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            if ($request->expectsJson()) {
                abort(401, 'Authentication required.');
            }
            return redirect()->route('platform-admin.login')
                ->with('warning', 'Please sign in with your platform super administrator credentials.');
        }

        if (! $user->isSuperAdmin()) {
            if ($request->expectsJson()) {
                abort(403, 'Unauthorized. Platform Super Administrator privileges required.');
            }
            abort(403, 'Unauthorized. Platform Super Administrator privileges required.');
        }

        if (! $user->isActive()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('platform-admin.login')
                ->with('error', 'Your platform administrator account is suspended.');
        }

        return $next($request);
    }
}
