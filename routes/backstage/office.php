<?php

use App\Http\Controllers\Backstage\OfficeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('office', [OfficeController::class, 'index'])
        ->middleware('permission:view_office')
        ->name('office');

    Route::post('office/start', [OfficeController::class, 'start'])
        ->middleware('permission:create_office')
        ->name('office.start');

    Route::get('office/{office}', [OfficeController::class, 'show'])
        ->middleware('permission:view_office')
        ->name('office.show');

    Route::post('office/{office}/end', [OfficeController::class, 'end'])
        ->middleware('permission:update_office')
        ->name('office.end');

    Route::post('office/{office}/reopen', [OfficeController::class, 'reopen'])
        ->middleware('permission:update_office')
        ->name('office.reopen');

    Route::post('office/{office}/workers', [OfficeController::class, 'addWorker'])
        ->middleware('permission:update_office')
        ->name('office.workers.add');

    Route::delete('office/{office}/workers', [OfficeController::class, 'removeWorker'])
        ->middleware('permission:update_office')
        ->name('office.workers.remove');

    Route::post('office/{office}/record-sale', [OfficeController::class, 'recordSale'])
        ->middleware('permission:update_office')
        ->name('office.sales.record');

    Route::delete('office/{office}/remove-sale', [OfficeController::class, 'removeSale'])
        ->middleware('permission:update_office')
        ->name('office.sales.remove');

    Route::post('office/{office}/update-cash-breakdown', [OfficeController::class, 'updateCashBreakdown'])
        ->middleware('permission:update_office')
        ->name('office.breakdown.update');

    Route::post('office/{office}/update-start-totals', [OfficeController::class, 'updateStartTotals'])
        ->middleware('permission:update_office')
        ->name('office.start_totals.update');

    Route::post('office/{office}/update-sale-breakdown', [OfficeController::class, 'updateSaleBreakdown'])
        ->middleware('permission:update_office')
        ->name('office.sale_breakdown.update');

    Route::post('office/{office}/update-sale-variant', [OfficeController::class, 'updateSaleVariant'])
        ->middleware('permission:update_office')
        ->name('office.sale_variant.update');
});
