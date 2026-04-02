<?php

use App\Http\Controllers\Backstage\InventoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory');
    Route::post('inventory/items', [InventoryController::class, 'store'])->name('inventory.items.store');
    Route::put('inventory/items/{item}', [InventoryController::class, 'update'])->name('inventory.items.update');
    Route::delete('inventory/items/{item}', [InventoryController::class, 'destroy'])->name('inventory.items.destroy');
    Route::post('inventory/items/{item}/increment', [InventoryController::class, 'increment'])->name('inventory.items.increment');
    Route::post('inventory/items/{item}/decrement', [InventoryController::class, 'decrement'])->name('inventory.items.decrement');
});
