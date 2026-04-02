<?php

use App\Http\Controllers\Shared\ImageServingController;
use App\Http\Controllers\Store\OnlinePaymentController;
use App\Http\Controllers\Store\ShopController;
use Illuminate\Support\Facades\Route;

// Shop display — browsing, listing, item detail
Route::get('/', [ShopController::class, 'index'])->name('shop.index');
Route::get('/cart', [ShopController::class, 'cart'])->name('shop.cart');
Route::get('/item/{type}/{id}', [ShopController::class, 'show'])->name('shop.show');

// Checkout & payment
Route::post('/validate-cart', [OnlinePaymentController::class, 'validateCart'])->name('shop.validate-cart')->middleware('throttle:60,1');
Route::post('/checkout', [OnlinePaymentController::class, 'checkout'])->name('shop.checkout')->middleware('throttle:checkout');
Route::get('/confirmation', [OnlinePaymentController::class, 'confirmation'])->name('shop.confirmation');
Route::get('/payment/callback', [OnlinePaymentController::class, 'paymentCallback'])->name('shop.payment.callback');
Route::post('/payment/webhook', [OnlinePaymentController::class, 'webhook'])->name('shop.payment.webhook')->middleware('throttle:60,1');
Route::post('/payment/verify', [OnlinePaymentController::class, 'verifyPayment'])->name('shop.payment.verify')->middleware('throttle:30,1');

// Media serving — event and product images
Route::get('/events/images/{id}', [ImageServingController::class, 'show'])->name('shop.events.images');
Route::get('/products/images/{id}', [ImageServingController::class, 'showProduct'])->name('shop.products.images');
