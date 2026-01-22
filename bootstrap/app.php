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
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        using: function () {
            $isTesting = app()->runningUnitTests();

            // In testing, use null (no domain) for Backstage to match default test client and win collision on '/', 
            // and store.localhost for Store to avoid collision on '/' route.
            $backstageDomain = $isTesting ? null : env('APP_DOMAIN', 'laravel.danieljm.dpdns.org');
            $storeDomain = $isTesting ? 'store.localhost' : env('STORE_DOMAIN', 'store.danieljm.dpdns.org');

            Route::middleware('web')
                ->domain($backstageDomain)
                ->group(base_path('routes/backstage.php'));

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
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
