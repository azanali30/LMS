<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $userId,
        public ?int $organizationId,
        public string $scope,
        public array $notificationPayload,
    ) {}

    public function broadcastOn(): array
    {
        if ($this->scope === 'platform') {
            return [
                new PrivateChannel("App.Models.User.{$this->userId}"),
                new PrivateChannel('platform.super-admin'),
            ];
        }

        if ($this->organizationId !== null) {
            return [
                new PrivateChannel("org.{$this->organizationId}.user.{$this->userId}"),
            ];
        }

        return [
            new PrivateChannel("App.Models.User.{$this->userId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    /**
     * Broadcast only safe non-sensitive notification metadata.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->notificationPayload['id'] ?? null,
            'category' => $this->notificationPayload['category'] ?? 'system',
            'scope' => $this->scope,
            'organization_id' => $this->organizationId,
            'title' => $this->notificationPayload['title'] ?? 'Notification',
            'message' => $this->notificationPayload['message'] ?? '',
            'url' => $this->notificationPayload['url'] ?? '/notifications',
            'icon' => $this->notificationPayload['icon'] ?? 'bell',
            'severity' => $this->notificationPayload['severity'] ?? 'info',
            'browser_notify' => (bool) ($this->notificationPayload['browser_notify'] ?? false),
            'created_at' => $this->notificationPayload['created_at'] ?? now()->toIso8601String(),
        ];
    }
}

