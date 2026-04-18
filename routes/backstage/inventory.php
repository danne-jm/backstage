<?php

use App\Http\Controllers\Backstage\InventoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('inventory', [InventoryController::class, 'index'])
        ->middleware('permission:view_inventory')
        ->name('inventory');

    Route::post('inventory/items', [InventoryController::class, 'store'])
        ->middleware('permission:create_item')
        ->name('inventory.items.store');

    Route::put('inventory/items/{item}', [InventoryController::class, 'update'])
        ->middleware('permission:update_item')
        ->name('inventory.items.update');

    Route::delete('inventory/items/{item}', [InventoryController::class, 'destroy'])
        ->middleware('permission:delete_item')
        ->name('inventory.items.destroy');

    Route::post('inventory/items/{item}/increment', [InventoryController::class, 'increment'])
        ->middleware('permission:update_item')
        ->name('inventory.items.increment');

    Route::post('inventory/items/{item}/decrement', [InventoryController::class, 'decrement'])
        ->middleware('permission:update_item')
        ->name('inventory.items.decrement');
});
