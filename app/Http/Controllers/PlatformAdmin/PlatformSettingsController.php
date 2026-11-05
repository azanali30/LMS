<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingsController extends Controller
{
    /**
     * Display platform configuration overview and Super Admin security settings.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
            $user = $request->user();

            $systemInfo = [
                'appName' => config('app.name'),
                'environment' => config('app.env'),
                'laravelVersion' => app()->version(),
                'phpVersion' => PHP_VERSION,
                'dbConnection' => config('database.default'),
                'mailMailer' => config('mail.default'),
                'webUrl' => config('app.web_url', url('/')),
                'timezone' => config('app.timezone'),
            ];

            return Inertia::render('platform-admin/settings/index', [
                'systemInfo' => $systemInfo,
                'adminProfile' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at->format('M d, Y'),
                ],
            ]);
        });
    }

    /**
     * Update Super Admin password securely.
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        PlatformAuditLog::record(
            action: 'super_admin.password_changed',
            target: $user,
            details: ['email' => $user->email],
            request: $request
        );

        return back()->with('success', 'Your Platform Administrator password has been changed successfully.');
    }
}
