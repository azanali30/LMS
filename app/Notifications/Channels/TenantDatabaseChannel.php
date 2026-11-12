<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Channels\DatabaseChannel;
use Illuminate\Notifications\Notification;

class TenantDatabaseChannel extends DatabaseChannel
{
    protected function buildPayload($notifiable, Notification $notification): array
    {
        $payload = parent::buildPayload($notifiable, $notification);
        $data = $payload['data'] ?? [];

        $payload['organization_id'] = $data['organization_id'] ?? null;
        $payload['category'] = $data['category'] ?? 'system';
        $payload['scope'] = $data['scope'] ?? ($payload['organization_id'] ? 'organization' : 'platform');

        return $payload;
    }
}

