<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAuthController extends Controller
{
    /**
     * Show dedicated Platform Super Admin login interface.
     */
    public function showLogin(Request $request): Response|RedirectResponse
    {
        if ($request->user()?->isSuperAdmin()) {
            return redirect()->route('platform-admin.dashboard');
        }

        return Inertia::render('platform-admin/auth/login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Alias for showLogin.
     */
    public function showLoginForm(Request $request): Response|RedirectResponse
    {
        return $this->showLogin($request);
    }

    /**
     * Authenticate Super Admin session.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $email = strtolower(trim($credentials['email']));
        $throttleKey = 'platform-admin-login:' . $request->ip() . '|' . $email;

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            PlatformAuditLog::record(
                action: 'super_admin.login_throttled',
                details: ['email' => $email, 'ip' => $request->ip(), 'seconds' => $seconds],
                request: $request
            );

            throw ValidationException::withMessages([
                'email' => "Too many login attempts. Please wait {$seconds} seconds before retrying.",
            ]);
        }

        if (! Auth::validate(['email' => $email, 'password' => $credentials['password']])) {
            RateLimiter::hit($throttleKey, 60);

            PlatformAuditLog::record(
                action: 'super_admin.login_failed',
                details: ['email' => $email, 'reason' => 'invalid_credentials'],
                request: $request
            );

            throw ValidationException::withMessages([
                'email' => 'The provided credentials do not match our records.',
            ]);
        }

        $user = User::where('email', $email)->first();

        if (! $user || ! $user->isSuperAdmin()) {
            RateLimiter::hit($throttleKey, 60);

            PlatformAuditLog::record(
                action: 'super_admin.login_unauthorized_role',
                target: $user,
                details: ['email' => $email, 'attempted_role' => $user?->role],
                request: $request
            );

            throw ValidationException::withMessages([
                'email' => 'Access denied. This portal is strictly restricted to authorized platform administrators.',
            ]);
        }

        if (! $user->isActive()) {
            throw ValidationException::withMessages([
                'email' => 'Your platform administrator account has been suspended. Please contact platform operations.',
            ]);
        }

        RateLimiter::clear($throttleKey);

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        PlatformAuditLog::record(
            action: 'super_admin.login_success',
            target: $user,
            details: ['email' => $email],
            request: $request,
            user: $user
        );

        return redirect()->intended(route('platform-admin.dashboard'))
            ->with('success', "Welcome back, {$user->name}! Platform Administration Session Active.");
    }

    /**
     * Terminate Super Admin session.
     */
    public function logout(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user) {
            PlatformAuditLog::record(
                action: 'super_admin.logout',
                target: $user,
                details: ['email' => $user->email],
                request: $request,
                user: $user
            );
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('platform-admin.login')
            ->with('success', 'You have been safely signed out of the Platform Administration Portal.');
    }
}
