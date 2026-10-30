<?php

namespace App\Services;

use App\Models\FeeInvoice;
use App\Models\FeeReminderLog;
use App\Models\Organization;
use App\Models\StudentGuardian;
use App\Models\User;
use App\Notifications\FeePaymentReminderNotification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class FeeReminderService
{
    /**
     * Process automated fee reminders across all organizations or a specific organization.
     *
     * @return array Summary of processed reminders
     */
    public function processReminders(?int $organizationId = null, bool $dryRun = false): array
    {
        $orgQuery = Organization::where('status', 'active');
        if ($organizationId) {
            $orgQuery->where('id', $organizationId);
        }

        $organizations = $orgQuery->get();
        $totalStats = [
            'organizations' => $organizations->count(),
            'invoices_scanned' => 0,
            'reminders_dispatched' => 0,
            'skipped_already_sent' => 0,
            'skipped_fully_paid' => 0,
            'failed' => 0,
            'details' => [],
        ];

        foreach ($organizations as $org) {
            $stats = $this->processForOrganization($org, $dryRun);
            $totalStats['invoices_scanned'] += $stats['invoices_scanned'];
            $totalStats['reminders_dispatched'] += $stats['reminders_dispatched'];
            $totalStats['skipped_already_sent'] += $stats['skipped_already_sent'];
            $totalStats['skipped_fully_paid'] += $stats['skipped_fully_paid'];
            $totalStats['failed'] += $stats['failed'];
            $totalStats['details'][$org->name] = $stats;
        }

        return $totalStats;
    }

    /**
     * Process reminders for a single active organization respecting its timezone.
     */
    public function processForOrganization(Organization $organization, bool $dryRun = false): array
    {
        $timezone = $organization->timezone ?: 'UTC';
        $today = Carbon::now($timezone)->startOfDay();

        $stats = [
            'invoices_scanned' => 0,
            'reminders_dispatched' => 0,
            'skipped_already_sent' => 0,
            'skipped_fully_paid' => 0,
            'failed' => 0,
        ];

        // Retrieve all open/unpaid/partially paid invoices
        $invoices = FeeInvoice::withoutGlobalScopes()
            ->where('organization_id', $organization->id)
            ->where('status', '!=', 'paid')
            ->where('status', '!=', 'cancelled')
            ->where('balance_due', '>', 0)
            ->with(['student', 'schoolClass', 'classSection'])
            ->get();

        foreach ($invoices as $invoice) {
            $stats['invoices_scanned']++;

            // Crucial: Recalculate financial balance from recorded payments before sending
            $invoice->recalculateFinancials();
            if ($invoice->balance_due <= 0.0001 || $invoice->status === 'paid') {
                $stats['skipped_fully_paid']++;
                continue;
            }

            if (! $invoice->due_date) {
                continue;
            }

            $dueDate = Carbon::parse($invoice->due_date, $timezone)->startOfDay();
            $diffInDays = (int) round($today->diffInDays($dueDate, false)); // positive if due in future, negative if past

            $applicableReminderType = null;

            if ($diffInDays === 10) {
                // Rule 1: Exactly 10 calendar days before due date
                $applicableReminderType = 'before_due_10';
            } elseif ($diffInDays === 0) {
                // Rule 2: Exactly on due date
                $applicableReminderType = 'due_today';
            } elseif ($diffInDays === -10) {
                // Rule 3: Exactly 10 calendar days overdue
                $applicableReminderType = 'overdue_10';
            }

            if (! $applicableReminderType) {
                continue;
            }

            // 1. Dispatch to Student
            $student = $invoice->student;
            if ($student) {
                $this->dispatchNotification(
                    organization: $organization,
                    invoice: $invoice,
                    recipient: $student,
                    recipientType: 'student',
                    reminderType: $applicableReminderType,
                    stats: $stats,
                    dryRun: $dryRun
                );
            }

            // 2. Dispatch to Linked Guardians (if configured with contact information)
            $guardians = StudentGuardian::withoutGlobalScopes()
                ->where('organization_id', $organization->id)
                ->where('student_id', $invoice->student_id)
                ->where(function ($q) {
                    $q->whereNotNull('email')->orWhereNotNull('user_id');
                })
                ->get();

            foreach ($guardians as $guardian) {
                $guardianUser = $guardian->user_id ? User::find($guardian->user_id) : null;
                $recipientTarget = $guardianUser ?: (object) [
                    'name' => $guardian->name,
                    'email' => $guardian->email,
                    'phone' => $guardian->phone,
                ];

                $this->dispatchNotification(
                    organization: $organization,
                    invoice: $invoice,
                    recipient: $recipientTarget,
                    recipientType: 'guardian',
                    reminderType: $applicableReminderType,
                    stats: $stats,
                    dryRun: $dryRun,
                    guardianModel: $guardian
                );
            }
        }

        return $stats;
    }

    /**
     * Dispatch notification and record idempotent audit log.
     */
    protected function dispatchNotification(
        Organization $organization,
        FeeInvoice $invoice,
        object $recipient,
        string $recipientType,
        string $reminderType,
        array &$stats,
        bool $dryRun = false,
        ?StudentGuardian $guardianModel = null
    ): void {
        $channel = 'in_app';
        $email = $recipient->email ?? null;
        $phone = $recipient->phone ?? null;
        $userId = ($recipient instanceof User) ? $recipient->id : null;

        // Check if log exists to guarantee zero duplicates for invoice + recipient_type + reminder_type + channel
        $alreadyLogged = FeeReminderLog::where('fee_invoice_id', $invoice->id)
            ->where('recipient_type', $recipientType)
            ->where('reminder_type', $reminderType)
            ->where('channel', $channel)
            ->where('status', 'sent')
            ->exists();

        if ($alreadyLogged) {
            $stats['skipped_already_sent']++;
            return;
        }

        if ($dryRun) {
            $stats['reminders_dispatched']++;
            return;
        }

        // Recheck live balance right before sending: if payment occurred, suppress notification!
        $invoice->refresh();
        $invoice->recalculateFinancials();
        if ($invoice->balance_due <= 0.0001 || $invoice->status === 'paid') {
            FeeReminderLog::updateOrCreate(
                [
                    'fee_invoice_id' => $invoice->id,
                    'recipient_type' => $recipientType,
                    'reminder_type' => $reminderType,
                    'channel' => $channel,
                ],
                [
                    'organization_id' => $organization->id,
                    'student_id' => $invoice->student_id,
                    'recipient_id' => $userId,
                    'recipient_email' => $email,
                    'recipient_phone' => $phone,
                    'status' => 'suppressed_paid',
                    'sent_at' => now(),
                ]
            );

            $stats['skipped_fully_paid']++;
            return;
        }

        try {
            if ($recipient instanceof User) {
                $recipient->notify(new FeePaymentReminderNotification(
                    invoice: $invoice,
                    reminderType: $reminderType,
                    recipientRole: $recipientType
                ));
            } elseif (! empty($email)) {
                // Anonymous notifiable for guardian without user account
                \Illuminate\Support\Facades\Notification::route('mail', $email)
                    ->notify(new FeePaymentReminderNotification(
                        invoice: $invoice,
                        reminderType: $reminderType,
                        recipientRole: $recipientType
                    ));
            }

            // Store successful audit log
            FeeReminderLog::updateOrCreate(
                [
                    'fee_invoice_id' => $invoice->id,
                    'recipient_type' => $recipientType,
                    'reminder_type' => $reminderType,
                    'channel' => $channel,
                ],
                [
                    'organization_id' => $organization->id,
                    'student_id' => $invoice->student_id,
                    'recipient_id' => $userId,
                    'recipient_email' => $email,
                    'recipient_phone' => $phone,
                    'status' => 'sent',
                    'error_message' => null,
                    'sent_at' => now(),
                ]
            );

            $stats['reminders_dispatched']++;
        } catch (\Throwable $e) {
            Log::error("Failed to send fee reminder for invoice {$invoice->invoice_number}: " . $e->getMessage());

            FeeReminderLog::updateOrCreate(
                [
                    'fee_invoice_id' => $invoice->id,
                    'recipient_type' => $recipientType,
                    'reminder_type' => $reminderType,
                    'channel' => $channel,
                ],
                [
                    'organization_id' => $organization->id,
                    'student_id' => $invoice->student_id,
                    'recipient_id' => $userId,
                    'recipient_email' => $email,
                    'recipient_phone' => $phone,
                    'status' => 'failed',
                    'error_message' => substr($e->getMessage(), 0, 500),
                    'sent_at' => now(),
                ]
            );

            $stats['failed']++;
        }
    }
}
