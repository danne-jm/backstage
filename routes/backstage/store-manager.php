<?php

use App\Http\Controllers\Backstage\SalesController;
use App\Http\Controllers\Backstage\StoreManagerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('store-manager', 'store-manager/index')
        ->middleware('permission:view_store_manager')
        ->name('store-manager');

    Route::get('store-manager/data', [StoreManagerController::class, 'data'])
        ->middleware('permission:view_store_manager')
        ->name('store-manager.data');

    Route::get('store-manager/all-sales', [StoreManagerController::class, 'allSales'])
        ->middleware('permission:view_store_manager')
        ->name('store-manager.all-sales');

    Route::get('store-manager/all-sales/accounting', [StoreManagerController::class, 'accounting'])
        ->middleware('permission:view_store_manager')
        ->name('store-manager.accounting');

    // Sales summary used by the dashboard chart — accessible with either permission.
    Route::get('sales/summary', [SalesController::class, 'summary'])
        ->middleware('permission:view_dashboard,view_store_manager')
        ->name('sales.summary');
});
