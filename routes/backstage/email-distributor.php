<?php

use App\Http\Controllers\Backstage\DistributionController;
use App\Http\Controllers\Backstage\EmailDistributorController;
use App\Http\Controllers\Backstage\MailsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('email-distributor', [EmailDistributorController::class, 'index'])->name('email-distributor');
    Route::get('email-distributor/attendees/{event}', [EmailDistributorController::class, 'getAttendees'])->name('email-distributor.attendees');
    Route::get('email-distributor/attendees-all/{event}', [EmailDistributorController::class, 'getAllAttendees'])->name('email-distributor.attendees-all');

    Route::post('distribution/distribute', [DistributionController::class, 'distribute'])->name('distribution.distribute');

    // Mail log
    Route::get('email-distributor/mails', [MailsController::class, 'index'])->name('email-distributor.mails');
    Route::get('email-distributor/mails/{mail}/ticket', [MailsController::class, 'getTicketForMail'])->name('email-distributor.mails.ticket');
});
