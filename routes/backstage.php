<?php

use App\Http\Controllers\Backstage\Settings\PasswordController;
use App\Http\Controllers\Backstage\Settings\ProfileController;
use App\Http\Controllers\Backstage\Settings\TwoFactorAuthenticationController as SettingsTwoFactor;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Http\Controllers\AuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\EmailVerificationNotificationController;
use Laravel\Fortify\Http\Controllers\EmailVerificationPromptController;
use Laravel\Fortify\Http\Controllers\NewPasswordController;
use Laravel\Fortify\Http\Controllers\PasswordResetLinkController;
use Laravel\Fortify\Http\Controllers\RecoveryCodeController;
use Laravel\Fortify\Http\Controllers\RegisteredUserController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController;
use Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController;
use Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController;
use Laravel\Fortify\Http\Controllers\VerifyEmailController;
use Laravel\Fortify\RoutePath;

// Fortify Routes (Manually Registered for Domain Restriction)
Route::group(['middleware' => config('fortify.middleware', ['web'])], function () {
    $enableViews = config('fortify.views', true);

    // Authentication...
    if ($enableViews) {
        Route::get(RoutePath::for('login', '/login'), [AuthenticatedSessionController::class, 'create'])
            ->middleware(['guest:'.config('fortify.guard')])
            ->name('login');
    }

    $limiter = config('fortify.limiters.login');
    $twoFactorLimiter = config('fortify.limiters.two-factor');
    $verificationLimiter = config('fortify.limiters.verification', '6,1');

    Route::post(RoutePath::for('login', '/login'), [AuthenticatedSessionController::class, 'store'])
        ->middleware(array_filter([
            'guest:'.config('fortify.guard'),
            $limiter ? 'throttle:'.$limiter : null,
        ]));

    Route::post(RoutePath::for('logout', '/logout'), [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    // Password Reset...
    if (Features::enabled(Features::resetPasswords())) {
        if ($enableViews) {
            Route::get(RoutePath::for('password.request', '/forgot-password'), [PasswordResetLinkController::class, 'create'])
                ->middleware(['guest:'.config('fortify.guard')])
                ->name('password.request');

            Route::get(RoutePath::for('password.reset', '/reset-password/{token}'), [NewPasswordController::class, 'create'])
                ->middleware(['guest:'.config('fortify.guard')])
                ->name('password.reset');
        }

        Route::post(RoutePath::for('password.email', '/forgot-password'), [PasswordResetLinkController::class, 'store'])
            ->middleware(['guest:'.config('fortify.guard')])
            ->name('password.email');

        Route::post(RoutePath::for('password.update', '/reset-password'), [NewPasswordController::class, 'store'])
            ->middleware(['guest:'.config('fortify.guard')])
            ->name('password.update');
    }

    // Registration...
    if (Features::enabled(Features::registration())) {
        if ($enableViews) {
            Route::get(RoutePath::for('register', '/register'), [RegisteredUserController::class, 'create'])
                ->middleware(['guest:'.config('fortify.guard')])
                ->name('register');
        }

        Route::post(RoutePath::for('register', '/register'), [RegisteredUserController::class, 'store'])
            ->middleware(['guest:'.config('fortify.guard')]);
    }

    // Email Verification...
    if (Features::enabled(Features::emailVerification())) {
        if ($enableViews) {
            Route::get(RoutePath::for('verification.notice', '/email/verify'), [EmailVerificationPromptController::class, '__invoke'])
                ->middleware([config('fortify.auth_middleware', 'auth').':'.config('fortify.guard')])
                ->name('verification.notice');
        }

        Route::get(RoutePath::for('verification.verify', '/email/verify/{id}/{hash}'), [VerifyEmailController::class, '__invoke'])
            ->middleware([config('fortify.auth_middleware', 'auth').':'.config('fortify.guard'), 'signed', 'throttle:'.$verificationLimiter])
            ->name('verification.verify');

        Route::post(RoutePath::for('verification.send', '/email/verification-notification'), [EmailVerificationNotificationController::class, 'store'])
            ->middleware([config('fortify.auth_middleware', 'auth').':'.config('fortify.guard'), 'throttle:'.$verificationLimiter])
            ->name('verification.send');
    }

    // Two Factor Authentication...
    if (Features::enabled(Features::twoFactorAuthentication())) {
        if ($enableViews) {
            Route::get(RoutePath::for('two-factor.login', '/two-factor-challenge'), [TwoFactorAuthenticatedSessionController::class, 'create'])
                ->middleware(['guest:'.config('fortify.guard')])
                ->name('two-factor.login');
        }

        Route::post(RoutePath::for('two-factor.login', '/two-factor-challenge'), [TwoFactorAuthenticatedSessionController::class, 'store'])
            ->middleware(array_filter([
                'guest:'.config('fortify.guard'),
                $twoFactorLimiter ? 'throttle:'.$twoFactorLimiter : null,
            ]));

        $twoFactorMiddleware = Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')
            ? [config('fortify.auth_middleware', 'auth').':'.config('fortify.guard'), 'password.confirm']
            : [config('fortify.auth_middleware', 'auth').':'.config('fortify.guard')];

        Route::get(RoutePath::for('password.confirm', '/user/confirm-password'), [Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::class, 'show'])
             ->middleware([config('fortify.auth_middleware', 'auth').':'.config('fortify.guard')])
             ->name('password.confirm');

        Route::post(RoutePath::for('password.confirm', '/user/confirm-password'), [Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::class, 'store'])
             ->middleware([config('fortify.auth_middleware', 'auth').':'.config('fortify.guard')])
             ->name('password.confirm.store');

        Route::post(RoutePath::for('two-factor.enable', '/user/two-factor-authentication'), [TwoFactorAuthenticationController::class, 'store'])
            ->middleware($twoFactorMiddleware)
            ->name('two-factor.enable');

        Route::delete(RoutePath::for('two-factor.disable', '/user/two-factor-authentication'), [TwoFactorAuthenticationController::class, 'destroy'])
            ->middleware($twoFactorMiddleware)
            ->name('two-factor.disable');

        Route::get(RoutePath::for('two-factor.qr-code', '/user/two-factor-qr-code'), [TwoFactorQrCodeController::class, 'show'])
            ->middleware($twoFactorMiddleware)
            ->name('two-factor.qr-code');

        Route::get(RoutePath::for('two-factor.secret-key', '/user/two-factor-secret-key'), [TwoFactorSecretKeyController::class, 'show'])
            ->middleware($twoFactorMiddleware)
            ->name('two-factor.secret-key');

        Route::get(RoutePath::for('two-factor.recovery-codes', '/user/two-factor-recovery-codes'), [RecoveryCodeController::class, 'index'])
            ->middleware($twoFactorMiddleware)
            ->name('two-factor.recovery-codes');

        Route::post(RoutePath::for('two-factor.recovery-codes', '/user/two-factor-recovery-codes'), [RecoveryCodeController::class, 'store'])
            ->middleware($twoFactorMiddleware);
    }
});

Route::get('/', function () {
    return Inertia::render('Shared/welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/terms-conditions', function () {
    return Inertia::render('Shared/terms-conditions');
})->name('terms-conditions');

Route::get('/privacy-policy', function () {
    return Inertia::render('Shared/privacy-policy');
})->name('privacy-policy');

// Gmail OAuth redirect/callback (used for both connect and sign-in flows)
Route::get('auth/google/redirect', [App\Http\Controllers\Backstage\GmailOAuthController::class, 'redirectToGoogle'])->name('gmail.connect');
Route::get('auth/google/callback', [App\Http\Controllers\Backstage\GmailOAuthController::class, 'handleGoogleCallback'])->name('gmail.callback');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('Backstage/dashboard');
    })->name('dashboard')->middleware('permission:view_dashboard');

    // For now render the same dashboard-like pages for office, warehouse, and store-manager
    // Office overview dashboard
    Route::get('office', [App\Http\Controllers\Backstage\OfficeController::class, 'index'])->name('office')
        ->middleware('permission:view_office');

    Route::post('office/start', [App\Http\Controllers\Backstage\OfficeController::class, 'start'])->name('office.start')
        ->middleware('permission:create_office');

    // Active office shift management page
    Route::middleware(['permission:view_office'])->prefix('office/{office}')->group(function () {
        Route::get('', [App\Http\Controllers\Backstage\OfficeController::class, 'show'])->name('office.show');

        // Updates to a shift
        Route::middleware('permission:update_office')->group(function () {
            Route::post('add-worker', [App\Http\Controllers\Backstage\OfficeController::class, 'addWorker'])->name('office.add-worker');
            Route::post('record-sale', [App\Http\Controllers\Backstage\OfficeController::class, 'recordSale'])->name('office.record-sale');
            Route::post('remove-worker', [App\Http\Controllers\Backstage\OfficeController::class, 'removeWorker'])->name('office.remove-worker');
            Route::post('remove-sale', [App\Http\Controllers\Backstage\OfficeController::class, 'removeSale'])->name('office.remove-sale');
            Route::post('update-start-totals', [App\Http\Controllers\Backstage\OfficeController::class, 'updateStartTotals'])->name('office.update-start-totals');
            Route::post('update-cash-breakdown', [App\Http\Controllers\Backstage\OfficeController::class, 'updateCashBreakdown'])->name('office.update-cash-breakdown');
            Route::post('update-sale', [App\Http\Controllers\Backstage\OfficeController::class, 'updateSale'])->name('office.update-sale');
            Route::post('end', [App\Http\Controllers\Backstage\OfficeController::class, 'end'])->name('office.end');
            Route::post('reopen', [App\Http\Controllers\Backstage\OfficeController::class, 'reopen'])->name('office.reopen');
        });

        // Deletion
        Route::post('delete', [App\Http\Controllers\Backstage\OfficeController::class, 'destroy'])->name('office.destroy')
            ->middleware('permission:delete_office');
    });

    // Sellables management (products and events)
    Route::middleware(['permission:view_sellables'])->group(function () {
        Route::get('sellables', [App\Http\Controllers\Backstage\SellablesController::class, 'index'])->name('sellables');
        Route::get('sellables/expired', [App\Http\Controllers\Backstage\SellablesController::class, 'expired'])->name('sellables.expired');

        // Products
        Route::post('sellables/products', [App\Http\Controllers\Backstage\SellablesController::class, 'storeProduct'])->name('sellables.products.store')
            ->middleware('permission:create_product');
        Route::put('sellables/products/{product}', [App\Http\Controllers\Backstage\SellablesController::class, 'updateProduct'])->name('sellables.products.update')
            ->middleware('permission:update_product');
        Route::delete('sellables/products/{product}', [App\Http\Controllers\Backstage\SellablesController::class, 'destroyProduct'])->name('sellables.products.destroy')
            ->middleware('permission:delete_product');

        // Events
        Route::post('sellables/events', [App\Http\Controllers\Backstage\SellablesController::class, 'storeEvent'])->name('sellables.events.store')
            ->middleware('permission:create_event');
        Route::put('sellables/events/{event}', [App\Http\Controllers\Backstage\SellablesController::class, 'updateEvent'])->name('sellables.events.update')
            ->middleware('permission:update_event');
        Route::delete('sellables/events/{event}', [App\Http\Controllers\Backstage\SellablesController::class, 'destroyEvent'])->name('sellables.events.destroy')
            ->middleware('permission:delete_event');
        Route::delete('sellables/images/{image}', [App\Http\Controllers\Backstage\SellablesController::class, 'destroyImage'])->name('sellables.images.destroy')
            ->middleware('permission:update_event');
        Route::delete('sellables/product-images/{image}', [App\Http\Controllers\Backstage\SellablesController::class, 'destroyProductImage'])->name('sellables.product-images.destroy')
            ->middleware('permission:update_product');
    });

    // New canonical routes: attendees under sellables so URLs align with Sellables section
    Route::prefix('sellables/events/{event}')->middleware(['permission:view_event_attendees'])->group(function () {
        Route::get('attendees', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'index'])->name('events.attendees');
        Route::post('attendees/config', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'updateConfiguration'])->name('events.attendees.config')
            ->middleware('permission:update_event');
        Route::post('attendees/filter', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'updateFilter'])->name('events.attendees.filter')
            ->middleware('permission:update_event');
        Route::get('sheets', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'listSheets'])->name('events.sheets');
        Route::get('sheet-data', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'getSheetData'])->name('events.sheet-data');
        Route::post('attendees/update', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'update'])->name('events.attendees.update')
            ->middleware('permission:update_event_attendee');
    });

    // Backwards-compatible routes (keep old ticketing prefix working for now)
    Route::prefix('ticketing/events/{event}')->group(function () {
        Route::get('attendees', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'index']);
        Route::post('attendees/config', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'updateConfiguration']);
        Route::get('sheets', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'listSheets']);
        Route::get('sheet-data', [App\Http\Controllers\Backstage\EventAttendeeController::class, 'getSheetData']);
    });

    // Warehouse inventory pages & API
    Route::middleware(['permission:view_inventory'])->group(function () {
        Route::get('warehouse', [App\Http\Controllers\Backstage\Warehouse\ItemController::class, 'index'])->name('warehouse');
        Route::post('warehouse/items', [App\Http\Controllers\Backstage\Warehouse\ItemController::class, 'store'])->name('warehouse.items.store')
            ->middleware('permission:create_item');
        Route::put('warehouse/items/{item}', [App\Http\Controllers\Backstage\Warehouse\ItemController::class, 'update'])->name('warehouse.items.update')
            ->middleware('permission:update_item');
        Route::delete('warehouse/items/{item}', [App\Http\Controllers\Backstage\Warehouse\ItemController::class, 'destroy'])->name('warehouse.items.destroy')
            ->middleware('permission:delete_item');
    });

    Route::get('store-manager', function () {
        return Inertia::render('Backstage/store-manager');
    })->name('store-manager')->middleware('permission:view_store_manager');

    // JSON data for the Store Manager page (used by the React page)
    Route::get('store-manager/data', [App\Http\Controllers\Backstage\StoreManagerController::class, 'data'])->name('store-manager.data')
        ->middleware('permission:view_store_manager');

    // Endpoint to record an online/card sale (creates an OnlineSale and optionally records it on an office shift)
    Route::post('online-sales', [App\Http\Controllers\Backstage\OnlineSaleController::class, 'store'])->name('online-sales.store');
    // Sales summary endpoints (office vs online)
    Route::get('sales/summary', [App\Http\Controllers\Backstage\SalesController::class, 'summary'])->name('sales.summary');

    // Ticketing system (Ticket Distributor)
    Route::get('ticketing', [App\Http\Controllers\Backstage\TicketingController::class, 'index'])->name('ticketing')
        ->middleware('permission:view_ticket_distributor');

    // Fetch attendees for a specific event from Google Sheets (raw data, no parsing)
    Route::get('ticketing/attendees/{event}', function (\App\Models\Event $event) {
        try {
            // Check if event has spreadsheet configured
            if (! $event->google_spreadsheet_id || ! $event->google_sheet_name) {
                return response()->json([
                    'success' => false,
                    'message' => 'Spreadsheet not configured for this event',
                    'rows' => [],
                ]);
            }

            // Fetch raw data from Google Sheets
            $service = new \App\Services\GoogleSheetsService;
            $rows = $service->getSheetData($event->google_spreadsheet_id, $event->google_sheet_name);

            // Apply Filtering Logic
            $rows = $event->filterRows($rows);

            return response()->json([
                'success' => true,
                'rows' => $rows ?? [],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch attendees: '.$e->getMessage(),
                'rows' => [],
            ], 500);
        }
    })->name('ticketing.attendees')->middleware('permission:view_ticket_distributor');

    // Gmail OAuth connect for per-user sending (routes are registered publicly above)
    // Ticket scanner page
    Route::middleware(['permission:view_ticket_scanner'])->group(function () {
        Route::get('ticket-scanner', [App\Http\Controllers\Backstage\TicketScannerController::class, 'index'])->name('ticket-scanner');
        // SECURITY FIX: Require import_ticket permission for state-changing import action.
        // view_ticket_scanner should only allow viewing, not creating tickets.
        Route::post('ticket-scanner/import', [App\Http\Controllers\Backstage\TicketScannerController::class, 'import'])
            ->name('ticket-scanner.import')
            ->middleware('permission:import_ticket');
        Route::get('ticket-scanner/verify', [App\Http\Controllers\Backstage\TicketScannerController::class, 'verify'])->name('ticket-scanner.verify');
        Route::get('ticket-scanner/available-tickets', [App\Http\Controllers\Backstage\TicketScannerController::class, 'availableTickets'])->name('ticket-scanner.available-tickets');
        Route::get('ticket-scanner/scanned-tickets', [App\Http\Controllers\Backstage\TicketScannerController::class, 'scannedTickets'])->name('ticket-scanner.scanned-tickets');
    });

    // Distribution endpoint used by ticketing page to send normal HTML emails to recipients
    Route::post('distribution/distribute', [App\Http\Controllers\Backstage\DistributionController::class, 'distribute'])->name('distribute-emails')
        ->middleware('permission:send_tickets');

    // Mails log page
    Route::get('mails', [App\Http\Controllers\Backstage\MailsController::class, 'index'])->name('mails')
        ->middleware('permission:view_mail_distributor');
    Route::get('mails/{mail}/ticket', [App\Http\Controllers\Backstage\MailsController::class, 'getTicketForMail'])->name('mails.ticket');
});

// API route for fetching tickets by event (outside auth middleware)
use App\Http\Controllers\Backstage\TicketApiController;

Route::get('/api/tickets', [TicketApiController::class, 'tickets'])->middleware(['auth:sanctum', 'permission:view_event_attendees']);

// Route for serving event images (publicly accessible)
Route::get('/events/images/{id}', [App\Http\Controllers\Shared\ImageServingController::class, 'show']);

// Route for serving product images (publicly accessible)
Route::get('/products/images/{id}', [App\Http\Controllers\Shared\ImageServingController::class, 'showProduct']);

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit')
        ->middleware('permission:view_settings_profile');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update')
        ->middleware('permission:update_settings_profile');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy')
        ->middleware('permission:delete_account');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit')
        ->middleware('permission:view_settings_password');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware(['throttle:6,1', 'permission:update_settings_password'])
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('Backstage/settings/appearance');
    })->name('appearance.edit')->middleware('permission:view_settings_appearance');

    // Google settings - connect Gmail for per-user sending
    Route::get('settings/google', function () {
        return Inertia::render('Backstage/settings/google');
    })->name('settings.google')->middleware('permission:view_settings_google');

    // SECURITY FIX: Protected route for account linking (requires auth + permission)
    // This route sets oauth_intent='connect' to allow the callback to link accounts safely.
    Route::get('settings/google/connect', [\App\Http\Controllers\Backstage\GmailOAuthController::class, 'redirectToGoogleConnect'])
        ->name('settings.google.connect')
        ->middleware('permission:update_settings_google');

    // Disconnect Gmail (remove stored refresh token)
    Route::post('settings/google/disconnect', [\App\Http\Controllers\Backstage\GmailOAuthController::class, 'disconnect'])
        ->name('settings.google.disconnect')
        ->middleware('permission:update_settings_google');

    Route::get('settings/two-factor', [SettingsTwoFactor::class, 'show'])
        ->name('two-factor.show')
        ->middleware('permission:view_settings_2fa');

    // 2FA actions usually hit standard Fortify routes, but the page itself is guarded here.
    // Actual 2FA enable/disable might need generic guards if they aren't in this file,
    // but typically they are POST to /user/two-factor-authentication etc. guarded by Fortify.
    // We strictly guard the VIEW page here.

    // Update pinned footer navitems for the authenticated user
    Route::put('settings/profile/pinned', [ProfileController::class, 'updatePinned'])
        ->name('profile.pinned.update')
        ->middleware('permission:update_settings_footer');
    // Edit footer quick links page
    Route::get('settings/footer', [ProfileController::class, 'editPinned'])
        ->name('profile.footer.edit')
        ->middleware('permission:view_settings_footer');

    // User management (Admin or granular permission)
    Route::middleware('permission:view_settings_users')->group(function () {
        Route::get('settings/users', [\App\Http\Controllers\Backstage\Settings\UserManagementController::class, 'index'])
            ->name('settings.users');
        Route::post('settings/users', [\App\Http\Controllers\Backstage\Settings\UserManagementController::class, 'store'])
            ->name('settings.users.store')
            ->middleware('permission:create_user');
        Route::patch('settings/users/{id}', [\App\Http\Controllers\Backstage\Settings\UserManagementController::class, 'update'])
            ->name('settings.users.update')
            ->middleware('permission:update_user');
        Route::delete('settings/users/{id}', [\App\Http\Controllers\Backstage\Settings\UserManagementController::class, 'destroy'])
            ->name('settings.users.destroy')
            ->middleware('permission:delete_user');
    });
});
