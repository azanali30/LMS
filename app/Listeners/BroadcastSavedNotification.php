<?php

namespace App\Listeners;

use App\Events\NotificationCreated;
use App\Models\User;
use App\Notifications\Channels\TenantDatabaseChannel;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Events\NotificationSent;

class BroadcastSavedNotification
{
    public function handle(NotificationSent $event): void
    {
        if (! in_array($event->channel, ['database', TenantDatabaseChannel::class], true)) {
            return;
        }

        if (! $event->notifiable instanceof User) {
            return;
        }

        $dbNotification = $event->response instanceof DatabaseNotification
            ? $event->response
            : null;

        $data = $dbNotification?->data ?? (method_exists($event->notification, 'toArray') ? $event->notification->toArray($event->notifiable) : []);

        $orgId = isset($data['organization_id']) ? (int) $data['organization_id'] : null;
        $scope = (string) ($data['scope'] ?? ($orgId ? 'organization' : 'platform'));

        event(new NotificationCreated(
            userId: $event->notifiable->id,
            organizationId: $orgId,
            scope: $scope,
            notificationPayload: [
                'id' => $dbNotification?->id ?? $event->notification->id ?? null,
                'category' => $data['category'] ?? 'system',
                'title' => $data['title'] ?? 'Notification',
                'message' => $data['message'] ?? '',
                'url' => $data['url'] ?? '/notifications',
                'icon' => $data['icon'] ?? 'bell',
                'severity' => $data['severity'] ?? 'info',
                'browser_notify' => (bool) ($data['browser_notify'] ?? false),
                'created_at' => $dbNotification?->created_at?->toIso8601String() ?? now()->toIso8601String(),
            ],
        ));
    }
}

