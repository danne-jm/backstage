<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\OnlineTransaction;

/**
 * Development/testing payment gateway that auto-completes all payments immediately.
 * Never use in production.
 */
class DevelopmentPaymentGateway implements PaymentGatewayInterface
{
    public function createPayment(OnlineTransaction $transaction, array $metadata = []): PaymentResult
    {
        // Auto-complete in development: mark as completed immediately
        $paymentId = 'dev_' . $transaction->id . '_' . time();

        $transaction->update([
            'payment_status' => 'completed',
            'external_payment_id' => $paymentId,
            'completed_at' => now(),
        ]);

        return PaymentResult::success($paymentId, 'Development payment auto-completed', ['auto_complete' => true]);
    }

    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult
    {
        return PaymentResult::success($paymentId, 'Development payment verified');
    }

    public function getPaymentStatus(string $paymentId): PaymentResult
    {
        return PaymentResult::success($paymentId);
    }

    public function handleWebhook(array $payload): PaymentResult
    {
        return PaymentResult::success($payload['id'] ?? null);
    }

    public function supportsRefunds(): bool
    {
        return false;
    }

    public function refund(string $paymentId, ?float $amount = null): PaymentResult
    {
        return PaymentResult::failed('Refunds not supported in development mode');
    }

    public function isWebhookSignatureValid(string $body, string $signature): bool
    {
        return true; // Always valid in development
    }

    public function getName(): string
    {
        return 'development';
    }
}
