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
    })->name('dashboard')->middleware('permission:view_dashboard');

    // For now render the same dashboard-like pages for office, warehouse, and store-manager
    // Office overview dashboard
    Route::get('office', [App\Http\Controllers\OfficeController::class, 'index'])->name('office')
        ->middleware('permission:view_office');
    
    Route::post('office/start', [App\Http\Controllers\OfficeController::class, 'start'])->name('office.start')
        ->middleware('permission:create_office');

    // Active office shift management page
    Route::middleware(['permission:view_office'])->prefix('office/{office}')->group(function () {
        Route::get('', [App\Http\Controllers\OfficeController::class, 'show'])->name('office.show');
        
        // Updates to a shift
        Route::middleware('permission:update_office')->group(function () {
            Route::post('add-worker', [App\Http\Controllers\OfficeController::class, 'addWorker'])->name('office.add-worker');
            Route::post('record-sale', [App\Http\Controllers\OfficeController::class, 'recordSale'])->name('office.record-sale');
            Route::post('remove-worker', [App\Http\Controllers\OfficeController::class, 'removeWorker'])->name('office.remove-worker');
            Route::post('remove-sale', [App\Http\Controllers\OfficeController::class, 'removeSale'])->name('office.remove-sale');
            Route::post('update-start-totals', [App\Http\Controllers\OfficeController::class, 'updateStartTotals'])->name('office.update-start-totals');
            Route::post('update-cash-breakdown', [App\Http\Controllers\OfficeController::class, 'updateCashBreakdown'])->name('office.update-cash-breakdown');
            Route::post('update-sale', [App\Http\Controllers\OfficeController::class, 'updateSale'])->name('office.update-sale');
            Route::post('end', [App\Http\Controllers\OfficeController::class, 'end'])->name('office.end');
            Route::post('reopen', [App\Http\Controllers\OfficeController::class, 'reopen'])->name('office.reopen');
        });

        // Deletion
        Route::post('delete', [App\Http\Controllers\OfficeController::class, 'destroy'])->name('office.destroy')
            ->middleware('permission:delete_office');
    });

    // Sellables management (products and events)
    Route::middleware(['permission:view_sellables'])->group(function () {
        Route::get('sellables', [App\Http\Controllers\SellablesController::class, 'index'])->name('sellables');
        Route::get('sellables/expired', [App\Http\Controllers\SellablesController::class, 'expired'])->name('sellables.expired');
        
        // Products
        Route::post('sellables/products', [App\Http\Controllers\SellablesController::class, 'storeProduct'])->name('sellables.products.store')
            ->middleware('permission:create_product');
        Route::put('sellables/products/{product}', [App\Http\Controllers\SellablesController::class, 'updateProduct'])->name('sellables.products.update')
            ->middleware('permission:update_product');
        Route::delete('sellables/products/{product}', [App\Http\Controllers\SellablesController::class, 'destroyProduct'])->name('sellables.products.destroy')
            ->middleware('permission:delete_product');
            
        // Events
        Route::post('sellables/events', [App\Http\Controllers\SellablesController::class, 'storeEvent'])->name('sellables.events.store')
            ->middleware('permission:create_event');
        Route::put('sellables/events/{event}', [App\Http\Controllers\SellablesController::class, 'updateEvent'])->name('sellables.events.update')
            ->middleware('permission:update_event');
        Route::delete('sellables/events/{event}', [App\Http\Controllers\SellablesController::class, 'destroyEvent'])->name('sellables.events.destroy')
            ->middleware('permission:delete_event');
    });

    // New canonical routes: attendees under sellables so URLs align with Sellables section
    Route::prefix('sellables/events/{event}')->middleware(['permission:view_event_attendees'])->group(function () {
        Route::get('attendees', [App\Http\Controllers\EventAttendeeController::class, 'index'])->name('events.attendees');
        Route::post('attendees/config', [App\Http\Controllers\EventAttendeeController::class, 'updateConfiguration'])->name('events.attendees.config')
            ->middleware('permission:update_event');
        Route::post('attendees/filter', [App\Http\Controllers\EventAttendeeController::class, 'updateFilter'])->name('events.attendees.filter')
            ->middleware('permission:update_event');
        Route::get('sheets', [App\Http\Controllers\EventAttendeeController::class, 'listSheets'])->name('events.sheets');
        Route::get('sheet-data', [App\Http\Controllers\EventAttendeeController::class, 'getSheetData'])->name('events.sheet-data');
        Route::post('attendees/update', [App\Http\Controllers\EventAttendeeController::class, 'update'])->name('events.attendees.update')
            ->middleware('permission:update_event_attendee');
    });

    // Backwards-compatible routes (keep old ticketing prefix working for now)
    Route::prefix('ticketing/events/{event}')->group(function () {
        Route::get('attendees', [App\Http\Controllers\EventAttendeeController::class, 'index']);
        Route::post('attendees/config', [App\Http\Controllers\EventAttendeeController::class, 'updateConfiguration']);
        Route::get('sheets', [App\Http\Controllers\EventAttendeeController::class, 'listSheets']);
        Route::get('sheet-data', [App\Http\Controllers\EventAttendeeController::class, 'getSheetData']);
    });

    // Warehouse inventory pages & API
    Route::middleware(['permission:view_inventory'])->group(function () {
        Route::get('warehouse', [App\Http\Controllers\Warehouse\ItemController::class, 'index'])->name('warehouse');
        Route::post('warehouse/items', [App\Http\Controllers\Warehouse\ItemController::class, 'store'])->name('warehouse.items.store')
            ->middleware('permission:create_item');
        Route::put('warehouse/items/{item}', [App\Http\Controllers\Warehouse\ItemController::class, 'update'])->name('warehouse.items.update')
            ->middleware('permission:update_item');
        Route::delete('warehouse/items/{item}', [App\Http\Controllers\Warehouse\ItemController::class, 'destroy'])->name('warehouse.items.destroy')
            ->middleware('permission:delete_item');
    });

    Route::get('store-manager', function () {
        return Inertia::render('store-manager');
    })->name('store-manager')->middleware('permission:view_store_manager');

    // JSON data for the Store Manager page (used by the React page)
    Route::get('store-manager/data', [App\Http\Controllers\StoreManagerController::class, 'data'])->name('store-manager.data')
        ->middleware('permission:view_store_manager');

    // Endpoint to record an online/card sale (creates an OnlineSale and optionally records it on an office shift)
    Route::post('online-sales', [App\Http\Controllers\OnlineSaleController::class, 'store'])->name('online-sales.store');
    // Sales summary endpoints (office vs online)
    Route::get('sales/summary', [App\Http\Controllers\SalesController::class, 'summary'])->name('sales.summary');

    // Ticketing system (Ticket Distributor)
    Route::get('ticketing', [App\Http\Controllers\TicketingController::class, 'index'])->name('ticketing')
        ->middleware('permission:view_ticket_distributor');

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

            // Apply Filtering Logic
            $rows = $event->filterRows($rows);

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
    })->name('ticketing.attendees')->middleware('permission:view_ticket_distributor');

    // Gmail OAuth connect for per-user sending (routes are registered publicly above)
    // Ticket scanner page
    Route::middleware(['permission:view_ticket_scanner'])->group(function () {
        Route::get('ticket-scanner', [App\Http\Controllers\TicketScannerController::class, 'index'])->name('ticket-scanner');
        Route::post('ticket-scanner/import', [App\Http\Controllers\TicketScannerController::class, 'import'])->name('ticket-scanner.import');
        Route::get('ticket-scanner/verify', [App\Http\Controllers\TicketScannerController::class, 'verify'])->name('ticket-scanner.verify');
        Route::get('ticket-scanner/available-tickets', [App\Http\Controllers\TicketScannerController::class, 'availableTickets'])->name('ticket-scanner.available-tickets');
        Route::get('ticket-scanner/scanned-tickets', [App\Http\Controllers\TicketScannerController::class, 'scannedTickets'])->name('ticket-scanner.scanned-tickets');
    });

    // Distribution endpoint used by ticketing page to send normal HTML emails to recipients
    Route::post('distribution/distribute', [App\Http\Controllers\DistributionController::class, 'distribute'])->name('distribute-emails')
        ->middleware('permission:send_tickets');

    // Mails log page
    Route::get('mails', [App\Http\Controllers\MailsController::class, 'index'])->name('mails')
        ->middleware('permission:view_mail_distributor');
    Route::get('mails/{mail}/ticket', [App\Http\Controllers\MailsController::class, 'getTicketForMail'])->name('mails.ticket');
});

// API route for fetching tickets by event (outside auth middleware)
use App\Http\Controllers\TicketApiController;

Route::get('/api/tickets', [TicketApiController::class, 'tickets']);

require __DIR__.'/settings.php';
