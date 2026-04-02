<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        using: function () {
            $isTesting = app()->runningUnitTests();

            // In testing, use localhost for Backstage and store.localhost for Store
            // to avoid route collision on '/' while keeping domain separation.
            $backstageDomains = $isTesting
                ? ['localhost']
                : array_map('trim', explode(',', env('BACKSTAGE_DOMAIN', 'localhost')));
            $storeDomain = $isTesting ? 'store.localhost' : env('STORE_DOMAIN', 'store.localhost');

            foreach ($backstageDomains as $backstageDomain) {
                Route::middleware('web')
                    ->domain($backstageDomain)
                    ->group(base_path('routes/backstage.php'));
            }

            Route::middleware('web')
                ->domain($storeDomain)
                ->group(base_path('routes/store.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
