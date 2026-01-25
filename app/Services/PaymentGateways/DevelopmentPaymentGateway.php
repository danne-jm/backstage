<?php

namespace App\Services\PaymentGateways;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\OnlineTransaction;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Development Payment Gateway
 *
 * A mock payment gateway for development and testing environments.
 * Automatically completes payments without external provider interaction.
 * Useful for testing checkout flows without real payment processing.
 */
class DevelopmentPaymentGateway implements PaymentGatewayInterface
{
    /**
     * Create a new payment session. In development mode, this generates
     * a fake payment ID and immediately marks the payment as ready.
     */
    public function createPayment(OnlineTransaction $transaction, array $metadata = []): PaymentResult
    {
        // Generate a mock payment ID
        $paymentId = 'dev_'.Str::random(24);

        Log::info('Development Payment Gateway: Payment created', [
            'payment_id' => $paymentId,
            'transaction_id' => $transaction->id,
            'amount' => $transaction->total_amount,
            'reference' => $transaction->reference_id,
        ]);

        // Store the payment ID on the transaction for later verification
        $transaction->update([
            'external_payment_id' => $paymentId,
            'payment_status' => PaymentResult::STATUS_PENDING,
        ]);

        // In development, we return a pending status but will auto-verify
        // The frontend can immediately call verify in dev mode
        return PaymentResult::pending(
            paymentId: $paymentId,
            checkoutUrl: null, // No external checkout in dev mode
            metadata: [
                'mode' => 'development',
                'auto_complete' => true,
                'transaction_reference' => $transaction->reference_id,
            ]
        );
    }

    /**
     * Verify a payment. In development mode, this always succeeds.
     */
    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult
    {
        Log::info('Development Payment Gateway: Payment verified', [
            'payment_id' => $paymentId,
            'transaction_id' => $transaction->id,
        ]);

        // Update transaction status
        $transaction->update([
            'payment_status' => PaymentResult::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        return PaymentResult::success(
            paymentId: $paymentId,
            message: 'Payment completed successfully (development mode)',
            metadata: ['mode' => 'development']
        );
    }

    /**
     * Get payment status. In development, returns completed if payment ID starts with 'dev_'.
     */
    public function getPaymentStatus(string $paymentId): PaymentResult
    {
        // In dev mode, assume any dev_ prefixed payment is complete
        if (str_starts_with($paymentId, 'dev_')) {
            return PaymentResult::success(
                paymentId: $paymentId,
                message: 'Development payment completed',
                metadata: ['mode' => 'development']
            );
        }

        return PaymentResult::failed(
            message: 'Invalid payment ID for development gateway',
            errorCode: 'INVALID_PAYMENT_ID'
        );
    }

    /**
     * Handle webhook. Not used in development mode.
     */
    public function handleWebhook(array $payload): PaymentResult
    {
        Log::info('Development Payment Gateway: Webhook received (ignored)', $payload);

        return PaymentResult::success(
            message: 'Webhook acknowledged (development mode)',
            metadata: ['mode' => 'development']
        );
    }

    /**
     * Development gateway supports mock refunds.
     */
    public function supportsRefunds(): bool
    {
        return true;
    }

    /**
     * Process a mock refund.
     */
    public function refund(string $paymentId, ?float $amount = null): PaymentResult
    {
        Log::info('Development Payment Gateway: Refund processed', [
            'payment_id' => $paymentId,
            'amount' => $amount ?? 'full',
        ]);

        return new PaymentResult(
            status: PaymentResult::STATUS_REFUNDED,
            paymentId: $paymentId,
            message: 'Refund processed successfully (development mode)',
            metadata: [
                'mode' => 'development',
                'refunded_amount' => $amount,
            ]
        );
    }

    /**
     * Get gateway name.
     */
    public function getName(): string
    {
        return 'Development';
    }
}
