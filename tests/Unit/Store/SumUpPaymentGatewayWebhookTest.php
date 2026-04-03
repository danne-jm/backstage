<?php

namespace Tests\Unit\Store;

use App\Contracts\PaymentResult;
use App\Services\SumUpPaymentGateway;
use Tests\TestCase;

class SumUpPaymentGatewayWebhookTest extends TestCase
{
    public function test_it_prefers_checkout_id_for_paid_webhooks(): void
    {
        $gateway = new SumUpPaymentGateway();

        $result = $gateway->handleWebhook([
            'event_type' => 'CHECKOUT_STATUS_CHANGED',
            'status' => 'PAID',
            'id' => 'event-id-123',
            'checkout_id' => 'checkout-id-456',
            'checkout_reference' => 'order-ref-789',
            'transaction' => [
                'id' => 'payment-id-abc',
            ],
        ]);

        $this->assertSame(PaymentResult::STATUS_COMPLETED, $result->status);
        $this->assertSame('checkout-id-456', $result->paymentId);
        $this->assertSame('checkout-id-456', $result->metadata['checkout_id']);
        $this->assertSame('payment-id-abc', $result->metadata['payment_id']);
        $this->assertSame('order-ref-789', $result->metadata['reference_id']);
    }
}
