<?php

use Illuminate\Support\Facades\Route;

// Google account linking/unlinking — requires authenticated session
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('auth/google/connect', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'redirectToConnect'])
        ->name('google.connect');

    Route::delete('auth/google/disconnect', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'disconnect'])
        ->name('google.disconnect');
});
