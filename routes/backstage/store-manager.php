<?php

use App\Http\Controllers\Backstage\SalesController;
use App\Http\Controllers\Backstage\StoreManagerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('store-manager', 'store-manager/index')->name('store-manager');
    Route::get('store-manager/data', [StoreManagerController::class, 'data'])->name('store-manager.data');
    Route::get('store-manager/all-sales', [StoreManagerController::class, 'allSales'])->name('store-manager.all-sales');
    Route::get('sales/summary', [SalesController::class, 'summary'])->name('sales.summary');
});
