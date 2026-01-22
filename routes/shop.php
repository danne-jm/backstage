<?php

use App\Http\Controllers\OnlinePaymentController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

// Public Shop Routes
Route::get('/', [ShopController::class, 'index'])->name('shop.index');
Route::get('/cart', [ShopController::class, 'cart'])->name('shop.cart');
Route::get('/item/{type}/{id}', [ShopController::class, 'show'])->name('shop.show');

// Checkout and Confirmation
Route::post('/checkout', [OnlinePaymentController::class, 'checkout'])->name('shop.checkout')->middleware('throttle:checkout');
Route::get('/confirmation', [OnlinePaymentController::class, 'confirmation'])->name('shop.confirmation');

// Event images (served from database)
Route::get('/events/images/{id}', [App\Http\Controllers\ImageServingController::class, 'show'])->name('shop.events.images');

// Product images (served from database)
Route::get('/products/images/{id}', [App\Http\Controllers\ImageServingController::class, 'showProduct'])->name('shop.products.images');
