<?php

namespace Tests\Unit;

use App\Services\SumUpPaymentGateway;
use Tests\TestCase;

class SumUpWebhookSignatureTest extends TestCase
{
    public function test_valid_signature_passes(): void
    {
        $secret = 'my-webhook-secret';
        $body = '{"event_type":"CHECKOUT_STATUS_CHANGED","status":"PAID"}';
        $expected = hash_hmac('sha256', $body, $secret);

        $gateway = new SumUpPaymentGateway(webhookSecret: $secret);

        $this->assertTrue($gateway->isWebhookSignatureValid($body, $expected));
    }

    public function test_invalid_signature_fails(): void
    {
        $secret = 'my-webhook-secret';
        $body = '{"event_type":"CHECKOUT_STATUS_CHANGED","status":"PAID"}';

        $gateway = new SumUpPaymentGateway(webhookSecret: $secret);

        $this->assertFalse($gateway->isWebhookSignatureValid($body, 'wrong-signature'));
    }

    public function test_no_secret_allows_through_in_non_production(): void
    {
        // The test environment is not production.
        $gateway = new SumUpPaymentGateway(webhookSecret: null);

        $this->assertTrue($gateway->isWebhookSignatureValid('body', 'anything'));
    }

    public function test_signature_is_constant_time_comparison(): void
    {
        // Ensure the method still returns false even for a one-character-off signature.
        $secret = 'secret';
        $body = 'payload';
        $correct = hash_hmac('sha256', $body, $secret);
        $oneOff = substr($correct, 0, -1) . 'X';

        $gateway = new SumUpPaymentGateway(webhookSecret: $secret);

        $this->assertFalse($gateway->isWebhookSignatureValid($body, $oneOff));
    }
}
