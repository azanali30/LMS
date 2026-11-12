<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\DesktopAuthCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class DesktopAuthenticationController extends Controller
{
    /**
     * Web Authorization Prompt: User views request to connect Desktop Application.
     */
    public function connect(Request $request): Response|RedirectResponse
    {
        if (! $request->has(['code_challenge', 'state'])) {
            return redirect()->route('download')
                ->with('info', 'Desktop authentication must be initiated from the InstitutoPropio Windows application. Launch the desktop app and click "Sign In via Web Browser".');
        }

        $validated = $request->validate([
            'code_challenge' => ['required', 'string', 'min:43', 'max:128'],
            'state' => ['required', 'string', 'min:8', 'max:128'],
        ]);

        $user = $request->user();

        // Ensure user account is active if status column exists
        if (isset($user->status) && $user->status !== 'active') {
            Auth::guard('web')->logout();
            return redirect()->route('login')
                ->with('error', 'Your account is suspended or inactive. Please contact your institution administrator.');
        }

        // Resolve active organization
        $organization = $user->currentOrganization();
        $orgRole = $organization ? ($organization->pivot->role ?? $user->roleInOrganization($organization->id)) : null;

        return Inertia::render('auth/desktop-connect', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'organization' => $organization ? [
                'id' => $organization->id,
                'name' => $organization->name,
                'slug' => $organization->slug,
                'role' => $orgRole,
            ] : null,
            'codeChallenge' => $validated['code_challenge'],
            'state' => $validated['state'],
            'webUrl' => config('app.web_url'),
        ]);
    }

    /**
     * Issue short-lived, single-use authorization code bound to PKCE challenge.
     */
    public function authorizeApp(Request $request): Response|JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'code_challenge' => ['required', 'string', 'min:43', 'max:128'],
            'state' => ['required', 'string', 'min:8', 'max:128'],
        ]);

        $user = $request->user();

        // Rate limit: max 10 requests per minute per IP
        $rateLimitKey = 'desktop-auth-issue:' . $request->ip() . ':' . $user->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 10)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return back()->with('error', "Too many authorization attempts. Please wait {$seconds} seconds.");
        }
        RateLimiter::hit($rateLimitKey, 60);

        // Issue single-use code (5 minute expiry)
        $authCode = DesktopAuthCode::issue(
            user: $user,
            codeChallenge: $validated['code_challenge'],
            state: $validated['state'],
            clientIp: $request->ip(),
            ttlMinutes: 5
        );

        $customProtocolUrl = "institutopropio://auth/callback?code={$authCode->code}&state={$validated['state']}";

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'code' => $authCode->code,
                'state' => $validated['state'],
                'callback_url' => $customProtocolUrl,
            ]);
        }

        return Inertia::render('auth/desktop-authorized', [
            'callbackUrl' => $customProtocolUrl,
            'code' => $authCode->code,
            'state' => $validated['state'],
            'userEmail' => $user->email,
        ]);
    }

    /**
     * Consume authorization code inside desktop WebView, establish genuine Laravel session cookie.
     */
    public function consume(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:64'],
            'code_verifier' => ['required', 'string', 'min:43', 'max:128'],
            'state' => ['required', 'string', 'min:8', 'max:128'],
        ]);

        $code = $validated['code'];
        $verifier = $validated['code_verifier'];
        $state = $validated['state'];

        // Atomic consumption with database row lock
        $user = DB::transaction(function () use ($code, $verifier, $state) {
            $record = DesktopAuthCode::where('code', $code)
                ->lockForUpdate()
                ->first();

            if (! $record) {
                return null;
            }

            // Expiry and single-use validation
            if (! $record->isValid()) {
                return null;
            }

            // PKCE verification using RFC 7636 S256
            if (! $record->verifyChallenge($verifier)) {
                return null;
            }

            // State verification (CSRF / injection defense)
            if (! hash_equals($record->state, $state)) {
                return null;
            }

            // Atomic consumption
            $record->consume();

            return $record->user;
        });

        if (! $user) {
            if ($request->wantsJson()) {
                return response()->json([
                    'error' => 'invalid_grant',
                    'message' => 'The desktop authorization code is invalid, expired, or has already been used.',
                ], 422);
            }

            return redirect()->route('login')
                ->with('error', 'The desktop authorization code is invalid, expired, or has already been used. Please log in again.');
        }

        // Ensure user is active if status column exists
        if (isset($user->status) && $user->status !== 'active') {
            if ($request->wantsJson()) {
                return response()->json([
                    'error' => 'account_inactive',
                    'message' => 'Your user account is suspended or inactive.',
                ], 403);
            }

            return redirect()->route('login')
                ->with('error', 'Your user account is suspended or inactive.');
        }

        // Establish genuine Laravel session with HttpOnly session cookie
        Auth::guard('web')->login($user, remember: true);
        $request->session()->regenerate();

        // Mark session and cookie as desktop client
        $request->session()->put('is_desktop', true);
        cookie()->queue(cookie('is_desktop_client', '1', 525600, null, null, null, true));

        // Ensure active organization is set in session for seamless tenant context
        $defaultOrg = $user->currentOrganization() ?? $user->organizations()->where('organizations.status', 'active')->wherePivot('status', 'active')->first();
        if ($defaultOrg) {
            $request->session()->put('current_organization_id', $defaultOrg->id);
        }

        Log::info('Desktop session established via PKCE consume', [
            'user_id' => $user->id,
            'organization_id' => $defaultOrg?->id,
        ]);

        $targetUrl = route('dashboard');

        if ($request->wantsJson()) {
            return response()->json([
                'authenticated' => true,
                'redirect_url' => $targetUrl,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ]);
        }

        return redirect()->intended($targetUrl);
    }

    /**
     * Determine whether the incoming request originates from the desktop application.
     */
    public static function isDesktopClient(Request $request): bool
    {
        $userAgent = $request->header('User-Agent', '');
        if (str_contains($userAgent, 'InstitutoPropio-Desktop')) {
            return true;
        }

        if ($request->session()->get('is_desktop', false)) {
            return true;
        }

        if ($request->cookie('is_desktop_client') === '1') {
            return true;
        }

        return false;
    }

    /**
     * Dedicated desktop application Welcome / Sign-In screen.
     */
    public function welcome(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        if (Auth::guard('web')->check()) {
            Log::info('Desktop welcome: active session detected, redirecting to dashboard', [
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('dashboard');
        }

        Log::info('Desktop welcome: unauthenticated desktop view rendered', [
            'is_desktop' => self::isDesktopClient($request),
        ]);

        $response = Inertia::render('desktop/welcome', [
            'appName' => config('app.name', 'InstitutoPropio'),
            'webUrl' => $request->getSchemeAndHttpHost(),
            'isDesktop' => self::isDesktopClient($request),
        ])->toResponse($request);

        $origin = $request->header('Origin');
        $allowedTauriOrigins = [
            'http://tauri.localhost',
            'https://tauri.localhost',
            'tauri://localhost',
        ];
        if ($origin && in_array($origin, $allowedTauriOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }

    /**
     * Terminate the desktop application session cleanly.
     */
    public function logout(Request $request): RedirectResponse|JsonResponse
    {
        $isDesktop = self::isDesktopClient($request);

        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $targetUrl = $isDesktop ? route('desktop.welcome') : route('home');

        if ($request->wantsJson()) {
            return response()->json([
                'logged_out' => true,
                'redirect_url' => $targetUrl,
            ]);
        }

        return redirect($targetUrl);
    }
}
