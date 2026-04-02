<?php

use App\Http\Controllers\Backstage\TicketScannerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('ticket-scanner', [TicketScannerController::class, 'index'])->name('ticket-scanner');
    Route::post('ticket-scanner/import', [TicketScannerController::class, 'import'])->name('ticket-scanner.import');
    Route::post('ticket-scanner/verify', [TicketScannerController::class, 'verify'])->name('ticket-scanner.verify');
    Route::get('ticket-scanner/available-tickets', [TicketScannerController::class, 'availableTickets'])->name('ticket-scanner.available-tickets');
    Route::get('ticket-scanner/scanned-tickets', [TicketScannerController::class, 'scannedTickets'])->name('ticket-scanner.scanned-tickets');
});
