<?php

use App\Http\Controllers\Backstage\OfficeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('office', [OfficeController::class, 'index'])->name('office');
    Route::post('office/start', [OfficeController::class, 'start'])->name('office.start');

    Route::get('office/{office}', [OfficeController::class, 'show'])->name('office.show');
    Route::post('office/{office}/end', [OfficeController::class, 'end'])->name('office.end');
    Route::post('office/{office}/reopen', [OfficeController::class, 'reopen'])->name('office.reopen');

    Route::post('office/{office}/workers', [OfficeController::class, 'addWorker'])->name('office.workers.add');
    Route::delete('office/{office}/workers', [OfficeController::class, 'removeWorker'])->name('office.workers.remove');

    Route::post('office/{office}/record-sale', [OfficeController::class, 'recordSale'])->name('office.sales.record');
    Route::delete('office/{office}/remove-sale', [OfficeController::class, 'removeSale'])->name('office.sales.remove');
    Route::post('office/{office}/update-cash-breakdown', [OfficeController::class, 'updateCashBreakdown'])->name('office.breakdown.update');
    Route::post('office/{office}/update-start-totals', [OfficeController::class, 'updateStartTotals'])->name('office.start_totals.update');
    Route::post('office/{office}/update-sale-breakdown', [OfficeController::class, 'updateSaleBreakdown'])->name('office.sale_breakdown.update');
    Route::post('office/{office}/update-sale-variant', [OfficeController::class, 'updateSaleVariant'])->name('office.sale_variant.update');
});
