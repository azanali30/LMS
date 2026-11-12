<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\TimetableEntry;
use App\Models\TimetableReminderLog;
use Carbon\Carbon;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class TimetableReminderService
{
    public function __construct(
        private NotificationDispatcher $dispatcher
    ) {}

    public function processReminders(?int $organizationId = null, bool $dryRun = false): array
    {
        $orgs = Organization::query()
            ->where('status', 'active')
            ->when($organizationId, fn ($q) => $q->where('id', $organizationId))
            ->get();

        $stats = [
            'organizations' => $orgs->count(),
            'entries_matched' => 0,
            'reminders_dispatched' => 0,
            'skipped_duplicate' => 0,
        ];

        foreach ($orgs as $org) {
            $this->processForOrganization($org, $dryRun, $stats);
        }

        return $stats;
    }

    public function processForOrganization(Organization $organization, bool $dryRun, array &$stats): void
    {
        $timezone = $organization->timezone ?: 'UTC';
        $now = Carbon::now($timezone);
        $windowEnd = $now->copy()->addMinutes(5);
        $nowTime = $now->format('H:i:s');
        $windowEndTime = $windowEnd->format('H:i:s');
        $targetHm = $windowEnd->format('H:i');
        $dayOfWeek = strtolower($windowEnd->format('l'));
        $reminderDate = $windowEnd->toDateString();

        $entriesQuery = TimetableEntry::withoutGlobalScopes()
            ->where('organization_id', $organization->id)
            ->where('is_published', true)
            ->where('is_cancelled', false)
            ->where('day_of_week', $dayOfWeek)
            ->whereNotNull('teacher_id');

        if ($windowEndTime >= $nowTime) {
            $entriesQuery
                ->where('start_time', '>', $nowTime)
                ->where('start_time', '<=', $windowEndTime);
        } else {
            // Midnight rollover window (e.g. 23:57 -> 00:02)
            $entriesQuery->where('start_time', '<=', $windowEndTime);
        }

        $entries = $entriesQuery
            ->with(['subject', 'schoolClass', 'classSection', 'teacher'])
            ->get();

        foreach ($entries as $entry) {
            $stats['entries_matched']++;

            $teacher = $entry->teacher;
            if (! $teacher) {
                continue;
            }

            // Verify teacher still belongs actively to the organization
            $isActiveMember = $teacher->organizations()
                ->where('organizations.id', $organization->id)
                ->wherePivot('status', 'active')
                ->exists();

            if (! $isActiveMember) {
                continue;
            }

            $alreadySent = TimetableReminderLog::query()
                ->where('timetable_entry_id', $entry->id)
                ->where('teacher_id', $teacher->id)
                ->whereDate('reminder_date', $reminderDate)
                ->exists();

            if ($alreadySent) {
                $stats['skipped_duplicate']++;
                continue;
            }

            if ($dryRun) {
                $stats['reminders_dispatched']++;
                continue;
            }

            $subjectName = $entry->subject?->name ?? $entry->period_name ?? 'Scheduled Class';
            $className = $entry->schoolClass?->name ?? 'Class';
            $sectionName = $entry->classSection?->name;
            $classSection = $sectionName ? "{$className} ({$sectionName})" : $className;
            $room = $entry->room ?: 'TBA';
            $formattedTime = Carbon::createFromFormat('H:i', substr((string) $entry->start_time, 0, 5), $timezone)->format('g:i A');

            try {
                DB::transaction(function () use ($organization, $entry, $teacher, $reminderDate, $targetHm, $subjectName, $classSection, $room, $formattedTime) {
                    TimetableReminderLog::create([
                        'organization_id' => $organization->id,
                        'timetable_entry_id' => $entry->id,
                        'teacher_id' => $teacher->id,
                        'reminder_date' => $reminderDate,
                        'scheduled_for' => $targetHm,
                        'sent_at' => now(),
                    ]);

                    $this->dispatcher->toUsers(
                        recipients: $teacher,
                        organizationId: $organization->id,
                        category: 'timetable',
                        title: "Upcoming Class in 5 Minutes: {$subjectName}",
                        message: "{$subjectName} • {$classSection} • Room {$room} • Starts at {$formattedTime}",
                        url: '/school/timetable',
                        icon: 'clock',
                        severity: 'warning',
                        isCritical: false,
                        meta: [
                            'type' => 'timetable_reminder_5m',
                            'timetable_entry_id' => $entry->id,
                            'subject' => $subjectName,
                            'class_section' => $classSection,
                            'room' => $room,
                            'start_time' => $formattedTime,
                            'reminder_date' => $reminderDate,
                        ],
                    );
                });
            } catch (QueryException) {
                $stats['skipped_duplicate']++;
                continue;
            }

            $stats['reminders_dispatched']++;
        }
    }
}

