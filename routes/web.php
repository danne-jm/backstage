<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

#Onboarding
Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

#Dashboard / home
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

#Office
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('office', [App\Http\Controllers\OfficeController::class, 'index'])->name('office');
});

#Office Shift
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('office-shift', 'office/office-shift')->name('office-shift');
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
    Route::inertia('inventory', 'inventory')->name('inventory');
});

#Store
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('store', 'store')->name('store');
});

require __DIR__ . '/settings.php';
