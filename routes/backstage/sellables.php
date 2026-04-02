<?php

use App\Http\Controllers\Backstage\EventAttendeeController;
use App\Http\Controllers\Backstage\SellablesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('sellables', [SellablesController::class, 'index'])->name('sellables');
    Route::get('sellables/expired', [SellablesController::class, 'expired'])->name('sellables.expired');

    // Products
    Route::post('sellables/products', [SellablesController::class, 'storeProduct'])->name('sellables.products.store');
    Route::put('sellables/products/{product}', [SellablesController::class, 'updateProduct'])->name('sellables.products.update');
    Route::delete('sellables/products/{product}', [SellablesController::class, 'destroyProduct'])->name('sellables.products.destroy');
    Route::delete('sellables/products/image/{image}', [SellablesController::class, 'destroyProductImage'])->name('sellables.products.image.destroy');

    // Events
    Route::post('sellables/events', [SellablesController::class, 'storeEvent'])->name('sellables.events.store');
    Route::put('sellables/events/{event}', [SellablesController::class, 'updateEvent'])->name('sellables.events.update');
    Route::delete('sellables/events/{event}', [SellablesController::class, 'destroyEvent'])->name('sellables.events.destroy');
    Route::delete('sellables/events/image/{image}', [SellablesController::class, 'destroyImage'])->name('sellables.events.image.destroy');

    // Event attendees
    Route::prefix('sellables/events/{event}')->group(function () {
        Route::get('attendees', [EventAttendeeController::class, 'index'])->name('events.attendees');
        Route::post('attendees/config', [EventAttendeeController::class, 'updateConfiguration'])->name('events.attendees.config');
        Route::get('sheets', [EventAttendeeController::class, 'listSheets'])->name('events.attendees.sheets');
        Route::get('sheet-data', [EventAttendeeController::class, 'getSheetData'])->name('events.attendees.sheet-data');
        Route::post('attendees/update', [EventAttendeeController::class, 'update'])->name('events.attendees.update');
        Route::post('attendees/filter', [EventAttendeeController::class, 'updateFilter'])->name('events.attendees.filter');
        Route::post('attendees/validate-purchases', [EventAttendeeController::class, 'validatePurchases'])->name('events.attendees.validate-purchases');
        Route::post('attendees/verify-emails', [EventAttendeeController::class, 'verifyEmails'])->name('events.attendees.verify-emails');
    });
});
