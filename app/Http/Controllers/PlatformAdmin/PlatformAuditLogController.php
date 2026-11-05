<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAuditLogController extends Controller
{
    /**
     * Display immutable platform administrative audit logs.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
            $action = $request->query('action');
            $search = $request->query('search');

            $query = PlatformAuditLog::with('user')->latest();

            if ($action) {
                $query->where('action', $action);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('action', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%"));
                });
            }

            $logs = $query->paginate(25)->withQueryString()->through(function (PlatformAuditLog $log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'user_name' => $log->user?->name ?? 'System',
                    'user_email' => $log->user?->email,
                    'target_type' => class_basename((string) $log->target_type),
                    'target_id' => $log->target_id,
                    'details' => $log->details,
                    'ip_address' => $log->ip_address,
                    'created_at' => $log->created_at->format('M d, Y h:i:s A'),
                ];
            });

            $distinctActions = PlatformAuditLog::select('action')->distinct()->pluck('action');

            return Inertia::render('platform-admin/audit-logs/index', [
                'logs' => $logs,
                'distinctActions' => $distinctActions,
                'filters' => [
                    'action' => $action,
                    'search' => $search,
                ],
            ]);
        });
    }
}
