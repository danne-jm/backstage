<?php

use Illuminate\Support\Facades\Route;
// Welcome / onboarding — no auth required
Route::inertia('/', 'welcome')->name('home');

// Google OAuth — public-facing login flow
Route::get('auth/google/login', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'redirectToLogin'])
    ->middleware('guest')
    ->name('google.login');

Route::get('auth/google/callback', [\App\Http\Controllers\Backstage\Auth\GoogleController::class, 'handleConnectCallback'])
    ->name('google.callback');
