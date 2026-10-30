<?php

namespace App\Notifications;

use App\Models\OrganizationSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TrialExpiringNotification extends Notification
{
    use Queueable;

    public function __construct(
        public OrganizationSubscription $subscription,
        public int $daysRemaining
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (! empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $orgName = $this->subscription->organization?->name ?? 'Your Institution';
        $planName = $this->subscription->plan?->name ?? 'SkillForge';
        $days = $this->daysRemaining;

        $subject = $days === 0
            ? "[{$orgName}] Your 30-Day Free Trial Expires Today"
            : "[{$orgName}] Your Free Trial Expires in {$days} Day(s)";

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name},");

        if ($days === 0) {
            $mail->line("This is an important reminder that your 30-day free trial for **{$orgName}** ({$planName} tier) **expires today**.")
                ->line("All your school records, student profiles, and curricula remain completely preserved.");
        } else {
            $mail->line("Your 30-day free trial for **{$orgName}** ({$planName} tier) will expire in **{$days} day(s)**.");
        }

        return $mail
            ->line("To ensure uninterrupted administrative write access, you can request an official invoice or complete your subscription verification.")
            ->action('Manage Subscription & Billing', url('/organizations/billing'))
            ->line('Thank you for choosing SkillForge LMS for your educational institution.');
    }

    /**
     * Get the array representation for in-app database notification.
     */
    public function toArray(object $notifiable): array
    {
        $orgName = $this->subscription->organization?->name ?? 'Your Institution';
        $days = $this->daysRemaining;

        return [
            'type' => 'trial_expiring',
            'title' => $days === 0 ? 'Trial Expires Today' : "Trial Expires in {$days} Day(s)",
            'message' => "Your free trial for {$orgName} ".($days === 0 ? 'expires today' : "expires in {$days} day(s)").". Choose a plan or request an invoice to ensure uninterrupted access.",
            'days_remaining' => $days,
            'organization_id' => $this->subscription->organization_id,
            'url' => '/organizations/billing',
        ];
    }
}
