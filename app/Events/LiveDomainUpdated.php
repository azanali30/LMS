<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveDomainUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  array<int, string>  $roles
     */
    public function __construct(
        public int $organizationId,
        public string $domain,
        public array $roles = ['owner', 'admin'],
    ) {}

    public function broadcastOn(): array
    {
        return collect($this->roles)
            ->unique()
            ->map(fn (string $role) => new PrivateChannel("org.{$this->organizationId}.role.{$role}"))
            ->values()
            ->all();
    }

    public function broadcastAs(): string
    {
        return 'domain.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'organization_id' => $this->organizationId,
            'domain' => $this->domain,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}

