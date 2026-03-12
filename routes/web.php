<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

#Onboarding
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

# Google OAuth
Route::get('auth/google/connect', [\App\Http\Controllers\Auth\GoogleController::class, 'redirectToConnect'])
    ->middleware(['auth', 'verified'])
    ->name('google.connect');

Route::get('auth/google/login', [\App\Http\Controllers\Auth\GoogleController::class, 'redirectToLogin'])
    ->middleware('guest')
    ->name('google.login');

Route::get('auth/google/callback', [\App\Http\Controllers\Auth\GoogleController::class, 'handleConnectCallback'])
    ->name('google.callback');

Route::delete('auth/google/disconnect', [\App\Http\Controllers\Auth\GoogleController::class, 'disconnect'])
    ->middleware(['auth', 'verified'])
    ->name('google.disconnect');

#Dashboard / home
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

#Office
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('office', [App\Http\Controllers\OfficeController::class, 'index'])->name('office');
    Route::post('office/start', [App\Http\Controllers\OfficeController::class, 'start'])->name('office.start');

    // Shift interactions
    Route::get('office/{office}', [App\Http\Controllers\OfficeController::class, 'show'])->name('office.show');
    Route::post('office/{office}/end', [App\Http\Controllers\OfficeController::class, 'end'])->name('office.end');
    Route::post('office/{office}/reopen', [App\Http\Controllers\OfficeController::class, 'reopen'])->name('office.reopen');
    Route::post('office/{office}/workers', [App\Http\Controllers\OfficeController::class, 'addWorker'])->name('office.workers.add');
    Route::delete('office/{office}/workers', [App\Http\Controllers\OfficeController::class, 'removeWorker'])->name('office.workers.remove');
    Route::post('office/{office}/record-sale', [App\Http\Controllers\OfficeController::class, 'recordSale'])->name('office.sales.record');
    Route::delete('office/{office}/remove-sale', [App\Http\Controllers\OfficeController::class, 'removeSale'])->name('office.sales.remove');
    Route::post('office/{office}/update-cash-breakdown', [App\Http\Controllers\OfficeController::class, 'updateCashBreakdown'])->name('office.breakdown.update');
    Route::post('office/{office}/update-start-totals', [App\Http\Controllers\OfficeController::class, 'updateStartTotals'])->name('office.start_totals.update');
    Route::post('office/{office}/update-sale-breakdown', [App\Http\Controllers\OfficeController::class, 'updateSaleBreakdown'])->name('office.sale_breakdown.update');
});

#Sellables
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('sellables', [\App\Http\Controllers\SellablesController::class, 'index'])->name('sellables');
    Route::get('sellables/expired', [\App\Http\Controllers\SellablesController::class, 'expired'])->name('sellables.expired');
    Route::post('sellables/products', [\App\Http\Controllers\SellablesController::class, 'storeProduct'])->name('sellables.products.store');
    Route::put('sellables/products/{product}', [\App\Http\Controllers\SellablesController::class, 'updateProduct'])->name('sellables.products.update');
    Route::delete('sellables/products/{product}', [\App\Http\Controllers\SellablesController::class, 'destroyProduct'])->name('sellables.products.destroy');
    Route::delete('sellables/products/image/{image}', [\App\Http\Controllers\SellablesController::class, 'destroyProductImage'])->name('sellables.products.image.destroy');
    Route::post('sellables/events', [\App\Http\Controllers\SellablesController::class, 'storeEvent'])->name('sellables.events.store');
    Route::put('sellables/events/{event}', [\App\Http\Controllers\SellablesController::class, 'updateEvent'])->name('sellables.events.update');
    Route::delete('sellables/events/{event}', [\App\Http\Controllers\SellablesController::class, 'destroyEvent'])->name('sellables.events.destroy');
    Route::delete('sellables/events/image/{image}', [\App\Http\Controllers\SellablesController::class, 'destroyImage'])->name('sellables.events.image.destroy');
});

#Ticket Scanner
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('ticket-scanner', 'ticket-scanner')->name('ticket-scanner');
});

#Email Distributor
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('email-distributor', 'email-distributor')->name('email-distributor');
});

#Inventory
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('inventory', [App\Http\Controllers\InventoryController::class, 'index'])->name('inventory');
    Route::post('inventory/items', [App\Http\Controllers\InventoryController::class, 'store'])->name('inventory.items.store');
    Route::post('inventory/items/{item}/increment', [App\Http\Controllers\InventoryController::class, 'increment'])->name('inventory.items.increment');
    Route::post('inventory/items/{item}/decrement', [App\Http\Controllers\InventoryController::class, 'decrement'])->name('inventory.items.decrement');
    Route::put('inventory/items/{item}', [App\Http\Controllers\InventoryController::class, 'update'])->name('inventory.items.update');
    Route::delete('inventory/items/{item}', [App\Http\Controllers\InventoryController::class, 'destroy'])->name('inventory.items.destroy');
});

#Store Manager
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('store-manager', 'store-manager/index')->name('store-manager');
    Route::get('store-manager/data', [\App\Http\Controllers\StoreManagerController::class, 'data'])->name('store-manager.data');
    Route::get('sales/summary', [\App\Http\Controllers\SalesController::class, 'summary'])->name('sales.summary');
});

require __DIR__ . '/settings.php';
