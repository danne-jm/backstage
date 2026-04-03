<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('transactions:cleanup-abandoned --minutes=30')->everyFifteenMinutes();

if (env('LEDGER_BACKFILL_SCHEDULED', false)) {
    Schedule::command('ledger:backfill --chunk=500')->dailyAt('02:45');
}
