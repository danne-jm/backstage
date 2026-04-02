<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

#Onboarding
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

# Google OAuth
Route::get('auth/google/connect', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'redirectToConnect'])
    ->middleware(['auth', 'verified'])
    ->name('google.connect');

Route::get('auth/google/login', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'redirectToLogin'])
    ->middleware('guest')
    ->name('google.login');

Route::get('auth/google/callback', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'handleConnectCallback'])
    ->name('google.callback');

Route::delete('auth/google/disconnect', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'disconnect'])
    ->middleware(['auth', 'verified'])
    ->name('google.disconnect');

#Dashboard / home
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

#Office
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('office', [App\Http\Controllers\Backstage\OfficeController::class, 'index'])->name('office');
    Route::post('office/start', [App\Http\Controllers\Backstage\OfficeController::class, 'start'])->name('office.start');

    // Shift interactions
    Route::get('office/{office}', [App\Http\Controllers\Backstage\OfficeController::class, 'show'])->name('office.show');
    Route::post('office/{office}/end', [App\Http\Controllers\Backstage\OfficeController::class, 'end'])->name('office.end');
    Route::post('office/{office}/reopen', [App\Http\Controllers\Backstage\OfficeController::class, 'reopen'])->name('office.reopen');
    Route::post('office/{office}/workers', [App\Http\Controllers\Backstage\OfficeController::class, 'addWorker'])->name('office.workers.add');
    Route::delete('office/{office}/workers', [App\Http\Controllers\Backstage\OfficeController::class, 'removeWorker'])->name('office.workers.remove');
    Route::post('office/{office}/record-sale', [App\Http\Controllers\Backstage\OfficeController::class, 'recordSale'])->name('office.sales.record');
    Route::delete('office/{office}/remove-sale', [App\Http\Controllers\Backstage\OfficeController::class, 'removeSale'])->name('office.sales.remove');
    Route::post('office/{office}/update-cash-breakdown', [App\Http\Controllers\Backstage\OfficeController::class, 'updateCashBreakdown'])->name('office.breakdown.update');
    Route::post('office/{office}/update-start-totals', [App\Http\Controllers\Backstage\OfficeController::class, 'updateStartTotals'])->name('office.start_totals.update');
    Route::post('office/{office}/update-sale-breakdown', [App\Http\Controllers\Backstage\OfficeController::class, 'updateSaleBreakdown'])->name('office.sale_breakdown.update');
    Route::post('office/{office}/update-sale-variant', [App\Http\Controllers\Backstage\OfficeController::class, 'updateSaleVariant'])->name('office.sale_variant.update');
});

#Sellables
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('sellables', [\App\Http\Controllers\Backstage\SellablesController::class, 'index'])->name('sellables');
    Route::get('sellables/expired', [\App\Http\Controllers\Backstage\SellablesController::class, 'expired'])->name('sellables.expired');
    Route::post('sellables/products', [\App\Http\Controllers\Backstage\SellablesController::class, 'storeProduct'])->name('sellables.products.store');
    Route::put('sellables/products/{product}', [\App\Http\Controllers\Backstage\SellablesController::class, 'updateProduct'])->name('sellables.products.update');
    Route::delete('sellables/products/{product}', [\App\Http\Controllers\Backstage\SellablesController::class, 'destroyProduct'])->name('sellables.products.destroy');
    Route::delete('sellables/products/image/{image}', [\App\Http\Controllers\Backstage\SellablesController::class, 'destroyProductImage'])->name('sellables.products.image.destroy');
    Route::post('sellables/events', [\App\Http\Controllers\Backstage\SellablesController::class, 'storeEvent'])->name('sellables.events.store');
    Route::put('sellables/events/{event}', [\App\Http\Controllers\Backstage\SellablesController::class, 'updateEvent'])->name('sellables.events.update');
    Route::delete('sellables/events/{event}', [\App\Http\Controllers\Backstage\SellablesController::class, 'destroyEvent'])->name('sellables.events.destroy');
    Route::delete('sellables/events/image/{image}', [\App\Http\Controllers\Backstage\SellablesController::class, 'destroyImage'])->name('sellables.events.image.destroy');

    // Attendees
    Route::prefix('sellables/events/{event}')->group(function () {
        Route::get('attendees', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'index'])->name('events.attendees');
        Route::post('attendees/config', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'updateConfiguration'])->name('events.attendees.config');
        Route::get('sheets', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'listSheets'])->name('events.attendees.sheets');
        Route::get('sheet-data', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'getSheetData'])->name('events.attendees.sheet-data');
        Route::post('attendees/update', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'update'])->name('events.attendees.update');
        Route::post('attendees/filter', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'updateFilter'])->name('events.attendees.filter');
        Route::post('attendees/validate-purchases', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'validatePurchases'])->name('events.attendees.validate-purchases');
        Route::post('attendees/verify-emails', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'verifyEmails'])->name('events.attendees.verify-emails');
    });
});

#Ticket Scanner
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('ticket-scanner', [App\Http\Controllers\Backstage\TicketScannerController::class, 'index'])->name('ticket-scanner');
    Route::post('ticket-scanner/import', [App\Http\Controllers\Backstage\TicketScannerController::class, 'import'])->name('ticket-scanner.import');
    Route::post('ticket-scanner/verify', [App\Http\Controllers\Backstage\TicketScannerController::class, 'verify'])->name('ticket-scanner.verify');
    Route::get('ticket-scanner/available-tickets', [App\Http\Controllers\Backstage\TicketScannerController::class, 'availableTickets'])->name('ticket-scanner.available-tickets');
    Route::get('ticket-scanner/scanned-tickets', [App\Http\Controllers\Backstage\TicketScannerController::class, 'scannedTickets'])->name('ticket-scanner.scanned-tickets');
});

#Email Distributor
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('email-distributor', [App\Http\Controllers\Backstage\EmailDistributorController::class, 'index'])
        ->name('email-distributor');

    Route::get('email-distributor/attendees/{event}', [App\Http\Controllers\Backstage\EmailDistributorController::class, 'getAttendees'])
        ->name('email-distributor.attendees');

    Route::get('email-distributor/attendees-all/{event}', [App\Http\Controllers\Backstage\EmailDistributorController::class, 'getAllAttendees'])
        ->name('email-distributor.attendees-all');

    Route::post('distribution/distribute', [App\Http\Controllers\Backstage\DistributionController::class, 'distribute'])
        ->name('distribution.distribute');

    # Mail log
    Route::get('email-distributor/mails', [App\Http\Controllers\Backstage\MailsController::class, 'index'])
        ->name('email-distributor.mails');

    Route::get('email-distributor/mails/{mail}/ticket', [App\Http\Controllers\Backstage\MailsController::class, 'getTicketForMail'])
        ->name('email-distributor.mails.ticket');
});

#Inventory
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('inventory', [App\Http\Controllers\Backstage\InventoryController::class, 'index'])->name('inventory');
    Route::post('inventory/items', [App\Http\Controllers\Backstage\InventoryController::class, 'store'])->name('inventory.items.store');
    Route::post('inventory/items/{item}/increment', [App\Http\Controllers\Backstage\InventoryController::class, 'increment'])->name('inventory.items.increment');
    Route::post('inventory/items/{item}/decrement', [App\Http\Controllers\Backstage\InventoryController::class, 'decrement'])->name('inventory.items.decrement');
    Route::put('inventory/items/{item}', [App\Http\Controllers\Backstage\InventoryController::class, 'update'])->name('inventory.items.update');
    Route::delete('inventory/items/{item}', [App\Http\Controllers\Backstage\InventoryController::class, 'destroy'])->name('inventory.items.destroy');
});

#Store Manager
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('store-manager', 'store-manager/index')->name('store-manager');
    Route::get('store-manager/data', [\App\Http\Controllers\Backstage\StoreManagerController::class, 'data'])->name('store-manager.data');
    Route::get('sales/summary', [\App\Http\Controllers\Backstage\SalesController::class, 'summary'])->name('sales.summary');
});

require __DIR__ . '/settings.php';
