<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        using: function () {
            $isTesting = app()->runningUnitTests();

            // In testing, use localhost for Backstage to match default test client,
            // and store.localhost for Store to avoid collision on '/' route.
            $backstageDomain = $isTesting ? 'localhost' : env('APP_DOMAIN', 'laravel.danieljm.dpdns.org');
            $storeDomain = $isTesting ? 'store.localhost' : env('STORE_DOMAIN', 'store.danieljm.dpdns.org');

            Route::middleware('web')
                ->domain($backstageDomain)
                ->group(function () {
                    // Backstage routes
                    include base_path('routes/backstage.php');

                    // Broadcasting auth routes MUST be inside the domain group to ensure
                    // the session cookie (scoped to the domain) is properly sent and processed.
                    \Illuminate\Support\Facades\Broadcast::routes();
                });

            // Ensure channels.php is loaded so channel authorization logic is registered.
            // This was previously handled by withRouting(channels: ...), but now we do it here.
            require base_path('routes/channels.php');

            Route::middleware('web')
                ->domain($storeDomain)
                ->group(base_path('routes/store.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            \App\Http\Middleware\Cors::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\TrackUserActivity::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
