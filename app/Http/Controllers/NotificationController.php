<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use App\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class NotificationController extends Controller
{
    /**
     * Get recent notifications (JSON for dropdown/polling) or render the Notification Center page.
     */
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        $user = $request->user();
        $org = TenantContext::current();
        $isPlatformScope = $org === null || $request->is('platform-admin*') || $request->query('scope') === 'platform';

        if (! $user) {
            return response()->json(['unread_count' => 0, 'notifications' => []]);
        }

        $baseQuery = $this->scopedQuery($user, $org?->id, $isPlatformScope);

        if ($request->wantsJson()) {
            $limit = min(max((int) $request->integer('limit', 15), 1), 50);
            $notifications = (clone $baseQuery)
                ->take($limit)
                ->get()
                ->map(fn ($n) => $this->formatNotification($n));

            return response()->json([
                'unread_count' => (clone $baseQuery)->whereNull('read_at')->count(),
                'notifications' => $notifications,
            ]);
        }

        $category = $request->string('category')->toString();
        $status = $request->string('status', 'all')->toString();

        $filteredQuery = clone $baseQuery;
        if ($category && array_key_exists($category, NotificationPreference::CATEGORIES)) {
            $filteredQuery->where('category', $category);
        }
        if ($status === 'unread') {
            $filteredQuery->whereNull('read_at');
        } elseif ($status === 'read') {
            $filteredQuery->whereNotNull('read_at');
        }

        $notifications = $filteredQuery
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($n) => $this->formatNotification($n));

        return Inertia::render('notifications/index', [
            'notificationsList' => $notifications,
            'unreadCount' => (clone $baseQuery)->whereNull('read_at')->count(),
            'filters' => [
                'category' => $category ?: 'all',
                'status' => in_array($status, ['all', 'unread', 'read'], true) ? $status : 'all',
            ],
            'categories' => NotificationPreference::CATEGORIES,
            'preferences' => NotificationPreference::matrixFor($user->id, $isPlatformScope ? null : $org?->id),
            'isPlatformScope' => $isPlatformScope,
        ]);
    }

    /**
     * Mark a specific notification as read (strictly scoped to the authenticated user).
     */
    public function markAsRead(string $id, Request $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $org = TenantContext::current();
        $isPlatformScope = $org === null || $request->is('platform-admin*') || $request->input('scope') === 'platform' || $request->query('scope') === 'platform';

        $notification = $this->scopedQuery($user, $org?->id, $isPlatformScope)
            ->where('id', $id)
            ->first();

        if (! $notification) {
            abort(404);
        }

        if (! $notification->read_at) {
            $notification->markAsRead();
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }

    /**
     * Mark all notifications in the current scope as read.
     */
    public function markAllAsRead(Request $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $org = TenantContext::current();
        $isPlatformScope = $org === null || $request->is('platform-admin*') || $request->input('scope') === 'platform' || $request->query('scope') === 'platform';

        $this->scopedQuery($user, $org?->id, $isPlatformScope)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'All notifications marked as read.');
    }

    /**
     * Delete a notification belonging to the authenticated user in the current scope.
     */
    public function destroy(string $id, Request $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $org = TenantContext::current();
        $isPlatformScope = $org === null || $request->is('platform-admin*') || $request->input('scope') === 'platform' || $request->query('scope') === 'platform';

        $deleted = $this->scopedQuery($user, $org?->id, $isPlatformScope)
            ->where('id', $id)
            ->delete();

        if (! $deleted) {
            abort(404);
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return back()->with('success', 'Notification deleted.');
    }

    /**
     * Update notification channel preferences for the authenticated user.
     */
    public function updatePreferences(Request $request): JsonResponse|RedirectResponse
    {
        $user = $request->user();
        $org = TenantContext::current();
        $organizationId = ($org && ! $request->is('platform-admin*') && $request->input('scope') !== 'platform') ? $org->id : null;

        $validated = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.category' => ['required', 'string', 'in:'.implode(',', array_keys(NotificationPreference::CATEGORIES))],
            'preferences.*.in_app' => ['required', 'boolean'],
            'preferences.*.browser' => ['required', 'boolean'],
            'preferences.*.email' => ['required', 'boolean'],
        ]);

        foreach ($validated['preferences'] as $item) {
            NotificationPreference::upsertPreference(
                userId: $user->id,
                organizationId: $organizationId,
                category: $item['category'],
                inApp: (bool) $item['in_app'],
                browser: (bool) $item['browser'],
                email: (bool) $item['email'],
            );
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'preferences' => NotificationPreference::matrixFor($user->id, $organizationId),
            ]);
        }

        return back()->with('success', 'Notification preferences saved.');
    }

    private function scopedQuery($user, ?int $organizationId, bool $isPlatformScope)
    {
        $query = $user->notifications()->latest();

        if ($isPlatformScope) {
            return $query->where('scope', 'platform');
        }

        return $query
            ->where('scope', 'organization')
            ->where('organization_id', $organizationId);
    }

    private function formatNotification($n): array
    {
        $data = is_array($n->data) ? $n->data : [];

        return [
            'id' => $n->id,
            'type' => $n->type,
            'category' => $n->category ?? ($data['category'] ?? 'system'),
            'scope' => $n->scope ?? ($data['scope'] ?? 'organization'),
            'organization_id' => $n->organization_id ?? ($data['organization_id'] ?? null),
            'data' => $data,
            'read_at' => $n->read_at ? $n->read_at->toIso8601String() : null,
            'created_at' => $n->created_at ? $n->created_at->diffForHumans() : '',
            'created_at_iso' => $n->created_at ? $n->created_at->toIso8601String() : null,
        ];
    }
}
