<?php

use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Backstage\AuditLogController;
use App\Http\Controllers\Backstage\EmailDistributorController;
use App\Http\Controllers\Backstage\EventAttendeeController;
use App\Http\Controllers\Backstage\InventoryController;
use App\Http\Controllers\Backstage\OfficeController;
use App\Http\Controllers\Backstage\SalesController;
use App\Http\Controllers\Backstage\SellablesController;
use App\Http\Controllers\Backstage\StoreManagerController;
use App\Http\Controllers\Backstage\TicketScannerController;
use App\Http\Controllers\Backstage\UsersController;
use Illuminate\Support\Facades\Route;

// ─── Google OAuth (no auth required — it IS the login mechanism) ───────────

Route::prefix('auth/google')->name('google.')->group(function () {
    Route::get('redirect', [GoogleController::class, 'redirect'])->name('redirect');
    Route::get('callback', [GoogleController::class, 'callback'])->name('callback');
});

// Disconnect requires authentication
Route::middleware('auth')->delete('auth/google/disconnect', [GoogleController::class, 'disconnect'])->name('google.disconnect');

// ─── Backstage (authenticated) ─────────────────────────────────────────────

Route::middleware(['auth'])->name('backstage.')->group(function () {

    // ─── Sellables ─────────────────────────────────────────────────────────

    Route::prefix('sellables')->name('sellables.')->group(function () {
        Route::get('/', [SellablesController::class, 'index'])->name('index');

        // Events
        Route::get('events/create', [SellablesController::class, 'createEvent'])->name('events.create');
        Route::post('events', [SellablesController::class, 'storeEvent'])->name('events.store');
        Route::get('events/{event}/edit', [SellablesController::class, 'editEvent'])->name('events.edit');
        Route::put('events/{event}', [SellablesController::class, 'updateEvent'])->name('events.update');
        Route::delete('events/{event}', [SellablesController::class, 'destroyEvent'])->name('events.destroy');

        // Products
        Route::get('products/create', [SellablesController::class, 'createProduct'])->name('products.create');
        Route::post('products', [SellablesController::class, 'storeProduct'])->name('products.store');
        Route::get('products/{product}/edit', [SellablesController::class, 'editProduct'])->name('products.edit');
        Route::put('products/{product}', [SellablesController::class, 'updateProduct'])->name('products.update');
        Route::delete('products/{product}', [SellablesController::class, 'destroyProduct'])->name('products.destroy');

        // Event attendees (nested under sellables/events)
        Route::prefix('events/{event}/attendees')->name('events.attendees.')->group(function () {
            Route::get('/', [EventAttendeeController::class, 'index'])->name('index');
            Route::post('sync-sheet', [EventAttendeeController::class, 'syncToSheet'])->name('sync-sheet');
            Route::patch('filter-config', [EventAttendeeController::class, 'updateFilterConfig'])->name('update-filter-config');
        });
    });

    // ─── Office (POS) ──────────────────────────────────────────────────────

    Route::prefix('office')->name('office.')->group(function () {
        Route::get('/', [OfficeController::class, 'index'])->name('index');
        Route::post('shift/start', [OfficeController::class, 'startShift'])->name('shift.start');
        Route::patch('shift/{shift}/end', [OfficeController::class, 'endShift'])->name('shift.end');
        Route::post('sale', [OfficeController::class, 'recordSale'])->name('sale.record');
        Route::patch('sale/{transaction}/void', [OfficeController::class, 'removeSale'])->name('sale.void');
    });

    // ─── Ticket Scanner ────────────────────────────────────────────────────

    Route::prefix('ticket-scanner')->name('ticket-scanner.')->group(function () {
        Route::get('/', function () {
            $latestEvent = \App\Models\Event::latest('event_date')->first();
            if ($latestEvent) {
                return redirect()->route('backstage.ticket-scanner.index', $latestEvent);
            }
            abort(404, 'No events available for scanning.');
        })->name('root');
        Route::get('{event}', [TicketScannerController::class, 'index'])->name('index');
        Route::post('{event}/scan', [TicketScannerController::class, 'scan'])->name('scan');
        Route::post('{event}/import', [TicketScannerController::class, 'import'])->name('import');
    });

    // ─── Email Distributor ─────────────────────────────────────────────────

    Route::prefix('email-distributor')->name('email-distributor.')->group(function () {
        Route::get('/', [EmailDistributorController::class, 'index'])->name('index');
        Route::post('distribute', [EmailDistributorController::class, 'distribute'])->name('distribute');
    });

    // ─── Inventory ─────────────────────────────────────────────────────────

    Route::prefix('inventory')->name('inventory.')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('index');
        Route::post('/', [InventoryController::class, 'store'])->name('store');
        Route::put('{item}', [InventoryController::class, 'update'])->name('update');
        Route::delete('{item}', [InventoryController::class, 'destroy'])->name('destroy');
    });

    // ─── Store Manager ─────────────────────────────────────────────────────

    Route::prefix('store-manager')->name('store-manager.')->group(function () {
        Route::get('/', [StoreManagerController::class, 'index'])->name('index');
        Route::get('stock', [StoreManagerController::class, 'stock'])->name('stock');
        Route::get('orders/{transaction}', [StoreManagerController::class, 'show'])->name('orders.show');
    });

    // Sales summary (hourly chart data — JSON)
    Route::get('sales/summary', [SalesController::class, 'summary'])->name('sales.summary');

    // ─── Audit Log ─────────────────────────────────────────────────────────

    Route::get('audit-log', [AuditLogController::class, 'index'])->name('audit-log.index');

    // ─── User Management ───────────────────────────────────────────────────

    Route::prefix('settings/users')->name('settings.users.')->group(function () {
        Route::get('/', [UsersController::class, 'index'])->name('index');
        Route::post('/', [UsersController::class, 'store'])->name('store');
        Route::put('{user}', [UsersController::class, 'update'])->name('update');
        Route::patch('{user}/toggle-lock', [UsersController::class, 'toggleLock'])->name('toggle-lock');
        Route::delete('{user}', [UsersController::class, 'destroy'])->name('destroy');
    });
});
