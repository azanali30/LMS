<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::command('fees:send-reminders --local-hour=8')->hourlyAt(0)->withoutOverlapping();
\Illuminate\Support\Facades\Schedule::command('timetable:send-reminders')->everyMinute()->withoutOverlapping();
\Illuminate\Support\Facades\Schedule::command('subscriptions:check-trials')->dailyAt('06:00')->withoutOverlapping();

