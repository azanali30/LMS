<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformUserController extends Controller
{
    /**
     * List all platform users with search, role and status filters.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
            $search = $request->query('search');
            $role = $request->query('role');
            $status = $request->query('status');

            $query = User::with(['organizations' => fn ($q) => $q->take(3)])
                ->withCount('organizations')
                ->latest();

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($role) {
                $query->where('role', $role);
            }

            if ($status && in_array($status, ['active', 'suspended'], true)) {
                $query->where('status', $status);
            }

            $users = $query->paginate(15)->withQueryString()->through(function (User $u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->role,
                    'status' => $u->status ?? 'active',
                    'email_verified' => $u->hasVerifiedEmail(),
                    'organizations_count' => $u->organizations_count,
                    'primary_organization' => $u->organizations->first()?->name,
                    'created_at' => $u->created_at->format('M d, Y'),
                ];
            });

            $roles = ['super_admin', 'student', 'teacher', 'admin', 'learner'];
            $counts = [
                'all' => User::count(),
                'active' => User::where('status', 'active')->count(),
                'suspended' => User::where('status', 'suspended')->count(),
                'super_admins' => User::where('role', 'super_admin')->count(),
            ];

            return Inertia::render('platform-admin/users/index', [
                'users' => $users,
                'roles' => $roles,
                'counts' => $counts,
                'filters' => [
                    'search' => $search,
                    'role' => $role,
                    'status' => $status,
                ],
            ]);
        });
    }

    /**
     * Show detailed user profile and relationships.
     */
    public function show(int $id): Response
    {
        return TenantContext::bypass(function () use ($id) {
            $user = User::with([
                'organizations' => function ($q) {
                    $q->withPivot(['role', 'status', 'title']);
                },
            ])->findOrFail($id);

            $auditLogs = PlatformAuditLog::where('target_type', User::class)
                ->where('target_id', $user->id)
                ->with('user')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user_name' => $log->user?->name ?? 'System',
                    'details' => $log->details,
                    'created_at' => $log->created_at->format('M d, Y h:i A'),
                ]);

            return Inertia::render('platform-admin/users/show', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status ?? 'active',
                    'email_verified_at' => $user->email_verified_at?->format('M d, Y h:i A'),
                    'two_factor_enabled' => ! empty($user->two_factor_secret),
                    'created_at' => $user->created_at->format('M d, Y h:i A'),
                ],
                'organizations' => $user->organizations->map(fn ($org) => [
                    'id' => $org->id,
                    'name' => $org->name,
                    'slug' => $org->slug,
                    'role' => $org->pivot->role,
                    'status' => $org->pivot->status,
                    'title' => $org->pivot->title,
                    'subdomain_url' => rescue(fn () => $org->subdomainUrl(), url('/'), false),
                ]),
                'auditLogs' => $auditLogs,
            ]);
        });
    }

    /**
     * Suspend or Activate user account.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $validated = $request->validate([
                'status' => ['required', 'string', 'in:active,suspended'],
                'reason' => ['nullable', 'string', 'max:500'],
            ]);

            $targetUser = User::findOrFail($id);

            // Guard: Super Admin cannot suspend themselves!
            if ($targetUser->id === $request->user()->id) {
                return back()->with('error', 'You cannot suspend your own Platform Super Administrator account.');
            }

            $previousStatus = $targetUser->status ?? 'active';
            $newStatus = $validated['status'];

            $targetUser->update(['status' => $newStatus]);

            PlatformAuditLog::record(
                action: $newStatus === 'suspended' ? 'user.suspended' : 'user.activated',
                target: $targetUser,
                details: [
                    'previous_status' => $previousStatus,
                    'new_status' => $newStatus,
                    'reason' => $validated['reason'] ?? null,
                ],
                request: $request
            );

            $msg = $newStatus === 'suspended'
                ? "User {$targetUser->email} has been suspended."
                : "User {$targetUser->email} has been activated.";

            return back()->with('success', $msg);
        });
    }
}
