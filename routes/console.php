<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reconcile stale pending payments every 15 minutes
// This provides a safety net for payments that succeeded on SumUp but failed to update locally
// due to server downtime, webhook failures, or network issues.
//
// TRADE-OFF: Stock is held for this duration before being released if payment fails.
// For high-demand events, reduce to ->everyTenMinutes() or ->everyFiveMinutes()
// But NEVER go below 5 minutes to avoid checking payments while users are still paying.
Schedule::command('payments:verify-pending')->everyFifteenMinutes();
