<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/terms-conditions', function () {
    return Inertia::render('terms-conditions');
})->name('terms-conditions');

Route::get('/privacy-policy', function () {
    return Inertia::render('privacy-policy');
})->name('privacy-policy');

// Gmail OAuth redirect/callback (used for both connect and sign-in flows)
Route::get('auth/google/redirect', [App\Http\Controllers\GmailOAuthController::class, 'redirectToGoogle'])->name('gmail.connect');
Route::get('auth/google/callback', [App\Http\Controllers\GmailOAuthController::class, 'handleGoogleCallback'])->name('gmail.callback');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // For now render the same dashboard-like pages for office, warehouse, and store-manager
    // Office overview dashboard
    Route::get('office', [App\Http\Controllers\OfficeController::class, 'index'])->name('office');
    Route::post('office/start', [App\Http\Controllers\OfficeController::class, 'start'])->name('office.start');

    // Active office shift management page
    Route::get('office/{office}', [App\Http\Controllers\OfficeController::class, 'show'])->name('office.show');
    Route::post('office/{office}/add-worker', [App\Http\Controllers\OfficeController::class, 'addWorker'])->name('office.add-worker');
    Route::post('office/{office}/record-sale', [App\Http\Controllers\OfficeController::class, 'recordSale'])->name('office.record-sale');
    Route::post('office/{office}/remove-worker', [App\Http\Controllers\OfficeController::class, 'removeWorker'])->name('office.remove-worker');
    Route::post('office/{office}/remove-sale', [App\Http\Controllers\OfficeController::class, 'removeSale'])->name('office.remove-sale');
    Route::post('office/{office}/update-start-totals', [App\Http\Controllers\OfficeController::class, 'updateStartTotals'])->name('office.update-start-totals');
    Route::post('office/{office}/update-cash-breakdown', [App\Http\Controllers\OfficeController::class, 'updateCashBreakdown'])->name('office.update-cash-breakdown');
    Route::post('office/{office}/update-sale', [App\Http\Controllers\OfficeController::class, 'updateSale'])->name('office.update-sale');
    Route::post('office/{office}/end', [App\Http\Controllers\OfficeController::class, 'end'])->name('office.end');
    // Allow deleting an office shift
    Route::post('office/{office}/delete', [App\Http\Controllers\OfficeController::class, 'destroy'])->name('office.destroy');
    // Allow reopening a closed office shift
    Route::post('office/{office}/reopen', [App\Http\Controllers\OfficeController::class, 'reopen'])->name('office.reopen');

    // Sellables management (products and events)
    Route::get('sellables', [App\Http\Controllers\SellablesController::class, 'index'])->name('sellables');
    // Endpoint to fetch further pages of expired events (server-side pagination)
    Route::get('sellables/expired', [App\Http\Controllers\SellablesController::class, 'expired'])->name('sellables.expired');
    Route::post('sellables/products', [App\Http\Controllers\SellablesController::class, 'storeProduct'])->name('sellables.products.store');
    Route::put('sellables/products/{product}', [App\Http\Controllers\SellablesController::class, 'updateProduct'])->name('sellables.products.update');
    Route::delete('sellables/products/{product}', [App\Http\Controllers\SellablesController::class, 'destroyProduct'])->name('sellables.products.destroy');
    Route::post('sellables/events', [App\Http\Controllers\SellablesController::class, 'storeEvent'])->name('sellables.events.store');
    Route::put('sellables/events/{event}', [App\Http\Controllers\SellablesController::class, 'updateEvent'])->name('sellables.events.update');
    Route::delete('sellables/events/{event}', [App\Http\Controllers\SellablesController::class, 'destroyEvent'])->name('sellables.events.destroy');

    // New canonical routes: attendees under sellables so URLs align with Sellables section
    Route::prefix('sellables/events/{event}')->group(function () {
        Route::get('attendees', [App\Http\Controllers\EventAttendeeController::class, 'index'])->name('events.attendees');
        Route::post('attendees/config', [App\Http\Controllers\EventAttendeeController::class, 'updateConfiguration'])->name('events.attendees.config');
        Route::get('sheets', [App\Http\Controllers\EventAttendeeController::class, 'listSheets'])->name('events.sheets');
        Route::get('sheet-data', [App\Http\Controllers\EventAttendeeController::class, 'getSheetData'])->name('events.sheet-data');
    });

    // Backwards-compatible routes (keep old ticketing prefix working for now)
    Route::prefix('ticketing/events/{event}')->group(function () {
        Route::get('attendees', [App\Http\Controllers\EventAttendeeController::class, 'index']);
        Route::post('attendees/config', [App\Http\Controllers\EventAttendeeController::class, 'updateConfiguration']);
        Route::get('sheets', [App\Http\Controllers\EventAttendeeController::class, 'listSheets']);
        Route::get('sheet-data', [App\Http\Controllers\EventAttendeeController::class, 'getSheetData']);
    });

    // Warehouse inventory pages & API
    Route::get('warehouse', [App\Http\Controllers\Warehouse\ItemController::class, 'index'])->name('warehouse');
    Route::post('warehouse/items', [App\Http\Controllers\Warehouse\ItemController::class, 'store'])->name('warehouse.items.store');
    Route::put('warehouse/items/{item}', [App\Http\Controllers\Warehouse\ItemController::class, 'update'])->name('warehouse.items.update');
    Route::delete('warehouse/items/{item}', [App\Http\Controllers\Warehouse\ItemController::class, 'destroy'])->name('warehouse.items.destroy');

    Route::get('store-manager', function () {
        return Inertia::render('store-manager');
    })->name('store-manager');

    // JSON data for the Store Manager page (used by the React page)
    Route::get('store-manager/data', [App\Http\Controllers\StoreManagerController::class, 'data'])->name('store-manager.data');

    // Online-specific sellables (overrides for online sales instances)
    Route::get('store-manager/online-sellables', [App\Http\Controllers\OnlineSellableController::class, 'index'])->name('store-manager.online-sellables.index');
    Route::get('store-manager/online-sellables/find', [App\Http\Controllers\OnlineSellableController::class, 'find'])->name('store-manager.online-sellables.find');
    Route::get('store-manager/online-sellables/{onlineSellable}', [App\Http\Controllers\OnlineSellableController::class, 'show'])->name('store-manager.online-sellables.show');
    Route::post('store-manager/online-sellables', [App\Http\Controllers\OnlineSellableController::class, 'store'])->name('store-manager.online-sellables.store');
    Route::put('store-manager/online-sellables/{onlineSellable}', [App\Http\Controllers\OnlineSellableController::class, 'update'])->name('store-manager.online-sellables.update');
    Route::post('store-manager/online-sellables/{onlineSellable}/images', [App\Http\Controllers\OnlineSellableController::class, 'uploadImage'])->name('store-manager.online-sellables.images');
    Route::delete('store-manager/online-sellables/{onlineSellable}', [App\Http\Controllers\OnlineSellableController::class, 'destroy'])->name('store-manager.online-sellables.destroy');

    // Sales summary endpoints (office vs online)
    Route::get('sales/summary', [App\Http\Controllers\SalesController::class, 'summary'])->name('sales.summary');

    // Ticketing system: render page with events so the event selector is populated
    Route::get('ticketing', function () {
        // Lazily import the Event model here to avoid affecting other route definitions
        $events = [];
        try {
            $events = \App\Models\Event::query()->orderBy('start_sell_date')->get();
        } catch (\Throwable $e) {
            // If the Event model/table isn't available yet (during some dev workflows),
            // fall back to an empty array to keep the page rendering.
            $events = [];
        }

        return Inertia::render('ticketing', [
            'events' => $events,
            // Pass templates to the frontend
            'templates' => \App\Models\MailTemplate::all(),
        ]);
    })->name('ticketing');

    // Fetch attendees for a specific event from Google Sheets (raw data, no parsing)
    Route::get('ticketing/attendees/{event}', function (\App\Models\Event $event) {
        try {
            // Check if event has spreadsheet configured
            if (! $event->google_spreadsheet_id || ! $event->google_sheet_name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Spreadsheet not configured for this event',
                    'rows' => [],
                ]);
            }

            // Fetch raw data from Google Sheets
            $service = new \App\Services\GoogleSheetsService;
            $rows = $service->getSheetData($event->google_spreadsheet_id, $event->google_sheet_name);

            return response()->json([
                'success' => true,
                'rows' => $rows ?? [],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendees: '.$e->getMessage(),
                'rows' => [],
            ], 500);
        }
    })->name('ticketing.attendees');

    // Gmail OAuth connect for per-user sending (routes are registered publicly above)
    // Ticket scanner page
    Route::get('ticket-scanner', [App\Http\Controllers\TicketScannerController::class, 'index'])->name('ticket-scanner');
    Route::post('ticket-scanner/import', [App\Http\Controllers\TicketScannerController::class, 'import'])->name('ticket-scanner.import');
    Route::get('ticket-scanner/verify', [App\Http\Controllers\TicketScannerController::class, 'verify'])->name('ticket-scanner.verify');
    Route::get('ticket-scanner/available-tickets', [App\Http\Controllers\TicketScannerController::class, 'availableTickets'])->name('ticket-scanner.available-tickets');
    Route::get('ticket-scanner/scanned-tickets', [App\Http\Controllers\TicketScannerController::class, 'scannedTickets'])->name('ticket-scanner.scanned-tickets');

    // Distribution endpoint used by ticketing page to send normal HTML emails to recipients
    Route::post('distribution/distribute', [App\Http\Controllers\DistributionController::class, 'distribute'])->name('distribute-emails');

    // Mails log page
    Route::get('mails', [App\Http\Controllers\MailsController::class, 'index'])->name('mails');
    Route::get('mails/{mail}/ticket', [App\Http\Controllers\MailsController::class, 'getTicketForMail'])->name('mails.ticket');
});

// API route for fetching tickets by event (outside auth middleware)
use App\Http\Controllers\TicketApiController;

Route::get('/api/tickets', [TicketApiController::class, 'tickets']);

require __DIR__.'/settings.php';
