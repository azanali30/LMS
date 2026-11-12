<?php

namespace App\Notifications;

use App\Models\FeeInvoice;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\Channels\TenantDatabaseChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class FeePaymentReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public FeeInvoice $invoice,
        public string $reminderType, // 'before_due_10' | 'due_today' | 'overdue_10'
        public string $recipientRole = 'student' // 'student' | 'guardian'
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        $channels = [];
        $isCritical = $this->reminderType === 'overdue_10';
        $prefs = $notifiable instanceof User
            ? NotificationPreference::resolveFor($notifiable->id, $this->invoice->organization_id, 'fees', $isCritical)
            : ['in_app' => true, 'browser' => false, 'email' => true];

        if ($prefs['in_app']) {
            $channels[] = TenantDatabaseChannel::class;
        }

        $mailer = config('mail.default');
        $mailConfigured = ! in_array($mailer, ['log', 'null', null, ''], true);

        if (($prefs['email'] || $isCritical) && $mailConfigured && ! empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $invoice = $this->invoice;
        $title = $this->getSubjectLine();
        $greeting = "Dear {$notifiable->name},";
        $currency = $invoice->currency ?: 'USD';
        $formattedBalance = number_format((float) $invoice->balance_due, 2) . ' ' . $currency;
        $formattedDue = $invoice->due_date ? $invoice->due_date->format('M d, Y') : 'N/A';
        $billingMonth = $invoice->billing_month ? $invoice->billing_month->format('F Y') : 'Current Period';

        $mail = (new MailMessage)
            ->subject("[{$invoice->organization->name}] {$title}")
            ->greeting($greeting);

        if ($this->reminderType === 'before_due_10') {
            $mail->line("This is an advance courtesy reminder that the institutional fee invoice for **{$billingMonth}** is due in 10 days on **{$formattedDue}**.");
        } elseif ($this->reminderType === 'due_today') {
            $mail->line("This is a reminder that the institutional fee invoice for **{$billingMonth}** is **DUE TODAY ({$formattedDue})**.");
        } else {
            $mail->line("This is an overdue notice that the institutional fee invoice for **{$billingMonth}** was due on **{$formattedDue}** and has an outstanding balance.");
        }

        $mail->line("**Invoice Number:** {$invoice->invoice_number}")
            ->line("**Student Name:** " . ($invoice->student?->name ?? 'Enrolled Student'))
            ->line("**Class / Section:** " . ($invoice->schoolClass?->name ?? '') . ' - ' . ($invoice->classSection?->name ?? 'General'))
            ->line("**Total Invoiced:** " . number_format((float) $invoice->total_amount, 2) . " {$currency}")
            ->line("**Amount Paid:** " . number_format((float) $invoice->paid_amount, 2) . " {$currency}")
            ->line("**Outstanding Balance:** {$formattedBalance}")
            ->action('View Fee Voucher & Receipts', url('/school/my-fees'))
            ->line('Please submit payments promptly through approved institutional payment channels.')
            ->salutation("Sincerely,\n" . ($invoice->organization?->name ?? 'AcademiaLMS Finance Administration'));

        return $mail;
    }

    /**
     * Get the array representation of the notification for in-app display.
     */
    public function toArray(object $notifiable): array
    {
        $invoice = $this->invoice;
        $currency = $invoice->currency ?: 'USD';

        return [
            'type' => 'fee_reminder',
            'category' => 'fees',
            'scope' => 'organization',
            'organization_id' => $invoice->organization_id,
            'reminder_type' => $this->reminderType,
            'recipient_role' => $this->recipientRole,
            'fee_invoice_id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'student_id' => $invoice->student_id,
            'student_name' => $invoice->student?->name,
            'billing_month' => $invoice->billing_month?->format('Y-m'),
            'due_date' => $invoice->due_date?->format('Y-m-d'),
            'total_amount' => (float) $invoice->total_amount,
            'paid_amount' => (float) $invoice->paid_amount,
            'balance_due' => (float) $invoice->balance_due,
            'currency' => $currency,
            'title' => $this->getSubjectLine(),
            'message' => $this->getInAppMessage(),
            'url' => '/school/my-fees',
            'icon' => 'credit-card',
            'severity' => $this->reminderType === 'overdue_10' ? 'error' : ($this->reminderType === 'due_today' ? 'warning' : 'info'),
        ];
    }

    private function getSubjectLine(): string
    {
        $studentName = $this->invoice->student?->name ?? 'Student';
        return match ($this->reminderType) {
            'before_due_10' => "Upcoming Fee Reminder: {$studentName} (Due in 10 Days)",
            'due_today' => "Fee Payment Due Today: {$studentName}",
            'overdue_10' => "Urgent Overdue Fee Notice: {$studentName}",
            default => "Institutional Fee Notice: {$studentName}",
        };
    }

    private function getInAppMessage(): string
    {
        $currency = $this->invoice->currency ?: 'USD';
        $bal = number_format((float) $this->invoice->balance_due, 2) . ' ' . $currency;
        $due = $this->invoice->due_date?->format('M d, Y') ?? '';

        return match ($this->reminderType) {
            'before_due_10' => "Invoice #{$this->invoice->invoice_number} balance of {$bal} is due on {$due}.",
            'due_today' => "Invoice #{$this->invoice->invoice_number} balance of {$bal} is due today ({$due}).",
            'overdue_10' => "Invoice #{$this->invoice->invoice_number} is overdue by 10 days. Outstanding: {$bal}.",
            default => "Invoice #{$this->invoice->invoice_number} has an outstanding balance of {$bal}.",
        };
    }
}
