<?php

namespace App\Console\Commands;

use App\Services\FeeReminderService;
use Illuminate\Console\Command;

class SendFeePaymentReminders extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'fees:send-reminders 
                            {--org= : Filter by specific Organization ID}
                            {--local-hour= : Minimum local hour (0-23) in each organization timezone before dispatching}
                            {--dry-run : Preview matching reminders without actually dispatching notifications}';

    /**
     * The console command description.
     */
    protected $description = 'Process and dispatch scheduled automated student fee payment reminders (10 days before, due today, and 10 days overdue)';

    /**
     * Execute the console command.
     */
    public function handle(FeeReminderService $service): int
    {
        $orgId = $this->option('org') ? (int) $this->option('org') : null;
        $localHour = $this->option('local-hour') !== null ? (int) $this->option('local-hour') : null;
        $isDryRun = (bool) $this->option('dry-run');

        $this->info("Scanning eligible fee invoices for reminder dispatches..." . ($isDryRun ? " (DRY RUN MODE)" : ""));

        $result = $service->processReminders($orgId, $isDryRun, $localHour);

        $this->table(
            ['Metric', 'Count'],
            [
                ['Organizations Evaluated', $result['organizations']],
                ['Invoices Scanned', $result['invoices_scanned']],
                ['Reminders Dispatched', $result['reminders_dispatched']],
                ['Skipped (Already Sent)', $result['skipped_already_sent']],
                ['Skipped (Fully Paid)', $result['skipped_fully_paid']],
                ['Failures Logged', $result['failed']],
            ]
        );

        $this->info("Fee reminder processing completed successfully.");

        return Command::SUCCESS;
    }
}
