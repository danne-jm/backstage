const fs = require('fs');
let file = 'routes/settings.php';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
    /Route::get\('settings\/users', \[UsersController::class, 'index'\]\)\n\s*->middleware\('password\.confirm'\)\n\s*->name\('settings\.users'\);/,
    `Route::get('settings/users', [UsersController::class, 'index'])
        ->middleware('password.confirm')
        ->name('settings.users');
    Route::post('settings/users', [UsersController::class, 'store'])->name('settings.users.store');
    Route::patch('settings/users/{user}', [UsersController::class, 'update'])->name('settings.users.update');
    Route::delete('settings/users/{user}', [UsersController::class, 'destroy'])->name('settings.users.destroy');`
);

fs.writeFileSync(file, data);
