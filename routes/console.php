<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('transactions:cleanup-abandoned --minutes=30')->everyFifteenMinutes();

Schedule::command('stock:reconcile')->dailyAt('03:00');

// Always run the ledger backfill as a safety net.
// It uses firstOrCreate with idempotency keys, so re-running is safe.
Schedule::command('ledger:backfill --chunk=500')->dailyAt('02:45');
