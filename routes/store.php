<?php

use App\Http\Controllers\Shared\ImageServingController;
use App\Http\Controllers\Store\OnlinePaymentController;
use App\Http\Controllers\Store\ShopController;
use Illuminate\Support\Facades\Route;

// Public Shop Routes
Route::get('/', [ShopController::class, 'index'])->name('shop.index');
Route::get('/cart', [ShopController::class, 'cart'])->name('shop.cart');
Route::get('/item/{type}/{id}', [ShopController::class, 'show'])->name('shop.show');

// Checkout, Validation, and Confirmation
Route::post('/validate-cart', [OnlinePaymentController::class, 'validateCart'])->name('shop.validate-cart')->middleware('throttle:60,1');
Route::post('/checkout', [OnlinePaymentController::class, 'checkout'])->name('shop.checkout')->middleware('throttle:checkout');
Route::get('/confirmation', [OnlinePaymentController::class, 'confirmation'])->name('shop.confirmation');

// Event images (served from database)
Route::get('/events/images/{id}', [ImageServingController::class, 'show'])->name('shop.events.images');

// Product images (served from database)
Route::get('/products/images/{id}', [ImageServingController::class, 'showProduct'])->name('shop.products.images');
