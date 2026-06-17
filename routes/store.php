<?php

use App\Http\Controllers\Store\OnlinePaymentController;
use App\Http\Controllers\Store\ShopController;
use App\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

// ─── Public Storefront ─────────────────────────────────────────────────────

Route::prefix('store')->name('store.')->group(function () {
    Route::get('/', [ShopController::class, 'index'])->name('index');
    Route::get('item/{type}/{id}', [ShopController::class, 'show'])->name('show');
    Route::get('cart', [ShopController::class, 'cart'])->name('cart');
    Route::post('cart/sellables', [ShopController::class, 'cartSellables'])->name('cart.sellables');

    // Checkout flow
    Route::post('validate-cart', [OnlinePaymentController::class, 'validateCart'])->name('validate-cart');
    Route::post('checkout', [OnlinePaymentController::class, 'checkout'])->name('checkout');
    Route::get('confirmation', [OnlinePaymentController::class, 'confirmation'])->name('confirmation');

    // Payment gateway integration
    Route::prefix('payment')->name('payment.')->group(function () {
        Route::get('callback', [OnlinePaymentController::class, 'callback'])->name('callback');
        Route::post('verify', [OnlinePaymentController::class, 'verify'])->name('verify');
        Route::post('webhook', [OnlinePaymentController::class, 'webhook'])
            ->name('webhook')
            ->withoutMiddleware([VerifyCsrfToken::class]);
    });
});
