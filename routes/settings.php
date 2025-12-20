<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    // Google settings - connect Gmail for per-user sending
    Route::get('settings/google', function () {
        return Inertia::render('settings/google');
    })->name('settings.google');

    // Disconnect Gmail (remove stored refresh token)
    Route::post('settings/google/disconnect', [\App\Http\Controllers\GmailOAuthController::class, 'disconnect'])->name('settings.google.disconnect');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    // Update pinned footer navitems for the authenticated user
    Route::put('settings/profile/pinned', [ProfileController::class, 'updatePinned'])->name('profile.pinned.update');
    // Edit footer quick links page
    Route::get('settings/footer', [ProfileController::class, 'editPinned'])->name('profile.footer.edit');

    // Admin-only user management
    Route::middleware('can:isAdmin')->group(function () {
        Route::get('settings/users', [\App\Http\Controllers\Settings\UserManagementController::class, 'index'])->name('settings.users');
        Route::post('settings/users', [\App\Http\Controllers\Settings\UserManagementController::class, 'store'])->name('settings.users.store');
        Route::patch('settings/users/{id}', [\App\Http\Controllers\Settings\UserManagementController::class, 'update'])->name('settings.users.update');
        Route::delete('settings/users/{id}', [\App\Http\Controllers\Settings\UserManagementController::class, 'destroy'])->name('settings.users.destroy');
    });
});
