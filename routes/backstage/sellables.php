<?php

use App\Http\Controllers\Backstage\EventAttendeeController;
use App\Http\Controllers\Backstage\SellablesController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Sellables index (lists products + events)
    Route::get('sellables', [SellablesController::class, 'index'])
        ->middleware('permission:view_sellables')
        ->name('sellables');

    Route::get('sellables/expired', [SellablesController::class, 'expired'])
        ->middleware('permission:view_sellables')
        ->name('sellables.expired');

    // Products
    Route::post('sellables/products', [SellablesController::class, 'storeProduct'])
        ->middleware('permission:create_product')
        ->name('sellables.products.store');

    Route::put('sellables/products/{product}', [SellablesController::class, 'updateProduct'])
        ->middleware('permission:update_product')
        ->name('sellables.products.update');

    Route::delete('sellables/products/{product}', [SellablesController::class, 'destroyProduct'])
        ->middleware('permission:delete_product')
        ->name('sellables.products.destroy');

    // Deleting a product image is an edit operation on the product.
    Route::delete('sellables/products/image/{image}', [SellablesController::class, 'destroyProductImage'])
        ->middleware('permission:update_product')
        ->name('sellables.products.image.destroy');

    // Events
    Route::post('sellables/events', [SellablesController::class, 'storeEvent'])
        ->middleware('permission:create_event')
        ->name('sellables.events.store');

    Route::put('sellables/events/{event}', [SellablesController::class, 'updateEvent'])
        ->middleware('permission:update_event')
        ->name('sellables.events.update');

    Route::delete('sellables/events/{event}', [SellablesController::class, 'destroyEvent'])
        ->middleware('permission:delete_event')
        ->name('sellables.events.destroy');

    Route::delete('sellables/events/image/{image}', [SellablesController::class, 'destroyImage'])
        ->middleware('permission:update_event')
        ->name('sellables.events.image.destroy');

    // Event attendees (sub-page of sellables)
    Route::prefix('sellables/events/{event}')->group(function () {
        Route::get('attendees', [EventAttendeeController::class, 'index'])
            ->middleware('permission:view_event_attendees')
            ->name('events.attendees');

        // Spreadsheet config + filter config — governed together by update_event_attendee_config
        Route::post('attendees/config', [EventAttendeeController::class, 'updateConfiguration'])
            ->middleware('permission:update_event_attendee_config')
            ->name('events.attendees.config');

        Route::get('sheets', [EventAttendeeController::class, 'listSheets'])
            ->middleware('permission:view_event_attendees')
            ->name('events.attendees.sheets');

        Route::get('sheet-data', [EventAttendeeController::class, 'getSheetData'])
            ->middleware('permission:view_event_attendees')
            ->name('events.attendees.sheet-data');

        // Writing a row back to Google Sheets
        Route::post('attendees/update', [EventAttendeeController::class, 'update'])
            ->middleware('permission:update_event_attendee')
            ->name('events.attendees.update');

        Route::post('attendees/filter', [EventAttendeeController::class, 'updateFilter'])
            ->middleware('permission:update_event_attendee_config')
            ->name('events.attendees.filter');

        Route::post('attendees/validate-purchases', [EventAttendeeController::class, 'validatePurchases'])
            ->middleware('permission:view_event_attendees')
            ->name('events.attendees.validate-purchases');

        Route::post('attendees/verify-emails', [EventAttendeeController::class, 'verifyEmails'])
            ->middleware('permission:view_event_attendees')
            ->name('events.attendees.verify-emails');
    });
});
