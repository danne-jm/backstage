<?php

use App\Http\Controllers\Backstage\AuditLogController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('audit-log', [AuditLogController::class, 'index'])
        ->middleware('permission:view_audit_log')
        ->name('audit-log.index');
});
