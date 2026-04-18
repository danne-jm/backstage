<?php

use App\Http\Controllers\Backstage\TicketScannerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('ticket-scanner', [TicketScannerController::class, 'index'])
        ->middleware('permission:view_ticket_scanner')
        ->name('ticket-scanner');

    Route::post('ticket-scanner/import', [TicketScannerController::class, 'import'])
        ->middleware('permission:import_tickets')
        ->name('ticket-scanner.import');

    Route::post('ticket-scanner/verify', [TicketScannerController::class, 'verify'])
        ->middleware('permission:scan_tickets')
        ->name('ticket-scanner.verify');

    Route::get('ticket-scanner/available-tickets', [TicketScannerController::class, 'availableTickets'])
        ->middleware('permission:view_ticket_scanner')
        ->name('ticket-scanner.available-tickets');

    Route::get('ticket-scanner/scanned-tickets', [TicketScannerController::class, 'scannedTickets'])
        ->middleware('permission:view_ticket_scanner')
        ->name('ticket-scanner.scanned-tickets');
});
