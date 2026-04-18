<?php

use App\Http\Controllers\Backstage\DistributionController;
use App\Http\Controllers\Backstage\EmailDistributorController;
use App\Http\Controllers\Backstage\MailsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Email distributor page + attendee data feeds
    Route::get('email-distributor', [EmailDistributorController::class, 'index'])
        ->middleware('permission:view_mail_distributor')
        ->name('email-distributor');

    Route::get('email-distributor/attendees/{event}', [EmailDistributorController::class, 'getAttendees'])
        ->middleware('permission:view_mail_distributor')
        ->name('email-distributor.attendees');

    Route::get('email-distributor/attendees-all/{event}', [EmailDistributorController::class, 'getAllAttendees'])
        ->middleware('permission:view_mail_distributor')
        ->name('email-distributor.attendees-all');

    // Bulk send
    Route::post('distribution/distribute', [DistributionController::class, 'distribute'])
        ->middleware('permission:send_mails')
        ->name('distribution.distribute');

    // Mail log (separate page — separate permission)
    Route::get('email-distributor/mails', [MailsController::class, 'index'])
        ->middleware('permission:view_mail_log')
        ->name('email-distributor.mails');

    Route::get('email-distributor/mails/{mail}/ticket', [MailsController::class, 'getTicketForMail'])
        ->middleware('permission:view_mail_log')
        ->name('email-distributor.mails.ticket');
});
