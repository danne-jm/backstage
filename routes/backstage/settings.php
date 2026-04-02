<?php

use App\Http\Controllers\Backstage\Settings\FooterController;
use App\Http\Controllers\Backstage\Settings\PasswordController;
use App\Http\Controllers\Backstage\Settings\ProfileController;
use App\Http\Controllers\Backstage\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Backstage\Settings\UsersController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');
    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');
    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::resource('settings/users', UsersController::class)->except(['create', 'edit', 'show']);

    Route::inertia('settings/google', 'settings/google')->name('settings.google');
    Route::get('settings/footer', [FooterController::class, 'edit'])->name('settings.footer');
    Route::patch('settings/footer', [FooterController::class, 'update'])->name('settings.footer.update');
});
