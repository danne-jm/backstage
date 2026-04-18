<?php

use App\Http\Controllers\Backstage\Settings\FooterController;
use App\Http\Controllers\Backstage\Settings\PasswordController;
use App\Http\Controllers\Backstage\Settings\ProfileController;
use App\Http\Controllers\Backstage\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Backstage\Settings\UsersController;
use Illuminate\Support\Facades\Route;

// Profile edit/update only requires auth (not email verification) — consistent with Fortify conventions.
Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])
        ->middleware('permission:view_settings_profile')
        ->name('profile.edit');

    Route::patch('settings/profile', [ProfileController::class, 'update'])
        ->middleware('permission:update_settings_profile')
        ->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])
        ->middleware('permission:delete_account')
        ->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])
        ->middleware('permission:view_settings_password')
        ->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware(['throttle:6,1', 'permission:update_settings_password'])
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')
        ->middleware('permission:view_settings_appearance')
        ->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->middleware('permission:view_settings_2fa')
        ->name('two-factor.show');

    // Users management — expanded from Route::resource for per-action permission middleware.
    // password.confirm is placed AFTER the permission check to avoid prompting users who
    // don't have access at all.
    Route::get('settings/users', [UsersController::class, 'index'])
        ->middleware(['permission:view_settings_users', 'password.confirm'])
        ->name('settings.users.index');

    Route::post('settings/users', [UsersController::class, 'store'])
        ->middleware('permission:create_user')
        ->name('settings.users.store');

    Route::match(['put', 'patch'], 'settings/users/{user}', [UsersController::class, 'update'])
        ->middleware('permission:update_user')
        ->name('settings.users.update');

    Route::delete('settings/users/{user}', [UsersController::class, 'destroy'])
        ->middleware('permission:delete_user')
        ->name('settings.users.destroy');

    Route::inertia('settings/google', 'settings/google')
        ->middleware('permission:view_settings_google')
        ->name('settings.google');

    Route::get('settings/footer', [FooterController::class, 'edit'])
        ->middleware('permission:view_settings_footer')
        ->name('settings.footer');

    Route::patch('settings/footer', [FooterController::class, 'update'])
        ->middleware('permission:update_settings_footer')
        ->name('settings.footer.update');
});
