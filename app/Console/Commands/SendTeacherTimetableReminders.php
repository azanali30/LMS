<?php

namespace App\Console\Commands;

use App\Services\TimetableReminderService;
use Illuminate\Console\Command;

class SendTeacherTimetableReminders extends Command
{
    protected $signature = 'timetable:send-reminders
                            {--org= : Filter by specific Organization ID}
                            {--dry-run : Preview matching periods without sending notifications}';

    protected $description = 'Notify assigned teachers exactly 5 minutes before scheduled timetable periods in the organization timezone';

    public function handle(TimetableReminderService $service): int
    {
        $orgId = $this->option('org') ? (int) $this->option('org') : null;
        $dryRun = (bool) $this->option('dry-run');

        $result = $service->processReminders($orgId, $dryRun);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Organizations Evaluated', $result['organizations']],
                ['Periods Matched (5m window)', $result['entries_matched']],
                ['Reminders Dispatched', $result['reminders_dispatched']],
                ['Skipped (Duplicate)', $result['skipped_duplicate']],
            ]
        );

        return Command::SUCCESS;
    }
}

