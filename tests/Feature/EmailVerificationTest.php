<?php

use App\Services\EmailVerificationService;

test('it validates syntax of email addresses', function () {
    $service = new EmailVerificationService;

    expect($service->verify('invalid-email')['valid'])->toBeFalse();
    expect($service->verify('test@example.com')['valid'])->toBeTrue();
});

test('it checks for MX/A records', function () {
    $service = new EmailVerificationService;

    // This domain definitely doesn't exist
    $res = $service->verify('test@this-domain-does-not-exist-123456789.com');
    expect($res['valid'])->toBeFalse();
    expect($res['stage'])->toBe('dns');
});

test('it validates a real domain', function () {
    $service = new EmailVerificationService;

    // Google's domain should have MX records
    $res = $service->verify('test@google.com');
    expect($res['valid'])->toBeTrue();
});
