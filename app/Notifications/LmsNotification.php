<?php

namespace App\Notifications;

use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\Channels\TenantDatabaseChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LmsNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [10, 60, 300];

    public function __construct(
        public string $category,
        public string $title,
        public string $message,
        public ?int $organizationId = null,
        public string $scope = 'organization',
        public string $url = '/notifications',
        public string $icon = 'bell',
        public string $severity = 'info',
        public bool $isCritical = false,
        public array $meta = [],
    ) {
        $this->afterCommit();
    }

    public function via(object $notifiable): array
    {
        $channels = [];

        $prefs = $notifiable instanceof User
            ? NotificationPreference::resolveFor($notifiable->id, $this->organizationId, $this->category, $this->isCritical)
            : ['in_app' => true, 'browser' => false, 'email' => false];

        if ($prefs['in_app']) {
            $channels[] = TenantDatabaseChannel::class;
        }

        $mailer = config('mail.default');
        $mailConfigured = ! in_array($mailer, ['log', 'null', null, ''], true);

        if ($prefs['email'] && $mailConfigured && ! empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title)
            ->greeting("Hello {$notifiable->name},")
            ->line($this->message)
            ->action('View in InstitutoPropio', url($this->url))
            ->line('You can manage your notification preferences anytime from your Notification Center.');
    }

    public function toArray(object $notifiable): array
    {
        $prefs = $notifiable instanceof User
            ? NotificationPreference::resolveFor($notifiable->id, $this->organizationId, $this->category, $this->isCritical)
            : ['in_app' => true, 'browser' => false, 'email' => false];

        return array_merge($this->meta, [
            'type' => $this->meta['type'] ?? $this->category,
            'category' => $this->category,
            'scope' => $this->scope,
            'organization_id' => $this->organizationId,
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
            'icon' => $this->icon,
            'severity' => $this->severity,
            'is_critical' => $this->isCritical,
            'browser_notify' => $prefs['browser'],
        ]);
    }
}

