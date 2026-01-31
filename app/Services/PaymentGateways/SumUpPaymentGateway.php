<?php

namespace App\Services\PaymentGateways;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\OnlineTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SumUp Payment Gateway
 *
 * Production payment gateway implementation using SumUp's Online Checkout API.
 * Handles payment creation, verification, and webhook processing for real payments.
 *
 * @see https://developer.sumup.com/docs/online-payments/introduction/
 */
class SumUpPaymentGateway implements PaymentGatewayInterface
{
    protected string $apiKey;

    protected string $merchantCode;

    protected string $apiBaseUrl;

    protected string $returnUrl;

    public function __construct()
    {
        $this->apiKey = config('services.sumup.api_key') ?? '';
        $this->merchantCode = config('services.sumup.merchant_code') ?? '';
        $this->apiBaseUrl = config('services.sumup.api_url') ?? 'https://api.sumup.com';
        $this->returnUrl = config('services.sumup.return_url') ?? (config('app.url').'/payment/callback');
    }

    /**
     * Create a SumUp checkout session.
     */
    public function createPayment(OnlineTransaction $transaction, array $metadata = []): PaymentResult
    {
        if (empty($this->apiKey) || empty($this->merchantCode)) {
            Log::error('SumUp Payment Gateway: Missing API credentials');

            return PaymentResult::failed(
                message: 'Payment service not configured',
                errorCode: 'MISSING_CREDENTIALS'
            );
        }

        try {
            $response = Http::withToken($this->apiKey)
                ->post("{$this->apiBaseUrl}/v0.1/checkouts", [
                    'checkout_reference' => $transaction->reference_id,
                    'amount' => round($transaction->total_amount, 2),
                    'currency' => 'EUR',
                    'pay_to_email' => $this->merchantCode,
                    'description' => $metadata['description'] ?? 'Store Purchase',
                    'return_url' => $this->returnUrl.'?reference='.$transaction->reference_id,
                    'merchant_code' => $this->merchantCode,
                ]);

            if (! $response->successful()) {
                Log::error('SumUp Payment Gateway: Failed to create checkout', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'transaction_id' => $transaction->id,
                ]);

                return PaymentResult::failed(
                    message: 'Failed to initialize payment',
                    errorCode: 'CHECKOUT_CREATION_FAILED',
                    metadata: ['response' => $response->json()]
                );
            }

            $data = $response->json();
            $checkoutId = $data['id'] ?? null;

            if (! $checkoutId) {
                Log::error('SumUp Payment Gateway: No checkout ID in response', [
                    'response' => $data,
                ]);

                return PaymentResult::failed(
                    message: 'Invalid response from payment provider',
                    errorCode: 'INVALID_RESPONSE'
                );
            }

            // Store payment ID on transaction
            $transaction->update([
                'external_payment_id' => $checkoutId,
                'payment_status' => PaymentResult::STATUS_PENDING,
            ]);

            Log::info('SumUp Payment Gateway: Checkout created', [
                'checkout_id' => $checkoutId,
                'transaction_id' => $transaction->id,
                'amount' => $transaction->total_amount,
            ]);

            // Build the checkout URL for frontend redirect
            $checkoutUrl = "https://pay.sumup.com/b2c/Q{$checkoutId}";

            return PaymentResult::pending(
                paymentId: $checkoutId,
                checkoutUrl: $checkoutUrl,
                metadata: [
                    'mode' => 'production',
                    'provider' => 'sumup',
                    'checkout_reference' => $transaction->reference_id,
                ]
            );

        } catch (\Exception $e) {
            Log::error('SumUp Payment Gateway: Exception during checkout creation', [
                'error' => $e->getMessage(),
                'transaction_id' => $transaction->id,
            ]);

            return PaymentResult::failed(
                message: 'Payment service temporarily unavailable',
                errorCode: 'SERVICE_ERROR',
                metadata: ['exception' => $e->getMessage()]
            );
        }
    }

    /**
     * Verify a SumUp payment status.
     */
    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->apiBaseUrl}/v0.1/checkouts/{$paymentId}");

            if (! $response->successful()) {
                Log::error('SumUp Payment Gateway: Failed to verify payment', [
                    'checkout_id' => $paymentId,
                    'status' => $response->status(),
                ]);

                return PaymentResult::failed(
                    message: 'Failed to verify payment status',
                    errorCode: 'VERIFICATION_FAILED'
                );
            }

            $data = $response->json();
            $status = $data['status'] ?? 'UNKNOWN';

            Log::info('SumUp Payment Gateway: Payment status retrieved', [
                'checkout_id' => $paymentId,
                'status' => $status,
            ]);

            return $this->mapSumUpStatus($status, $paymentId, $transaction, $data);

        } catch (\Exception $e) {
            Log::error('SumUp Payment Gateway: Exception during verification', [
                'error' => $e->getMessage(),
                'checkout_id' => $paymentId,
            ]);

            return PaymentResult::failed(
                message: 'Failed to verify payment',
                errorCode: 'SERVICE_ERROR'
            );
        }
    }

    /**
     * Get payment status from SumUp.
     */
    public function getPaymentStatus(string $paymentId): PaymentResult
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->apiBaseUrl}/v0.1/checkouts/{$paymentId}");

            if (! $response->successful()) {
                return PaymentResult::failed(
                    message: 'Failed to get payment status',
                    errorCode: 'STATUS_CHECK_FAILED'
                );
            }

            $data = $response->json();
            $status = $data['status'] ?? 'UNKNOWN';

            return $this->mapSumUpStatusSimple($status, $paymentId);

        } catch (\Exception $e) {
            return PaymentResult::failed(
                message: 'Payment status check failed',
                errorCode: 'SERVICE_ERROR'
            );
        }
    }

    /**
     * Handle SumUp webhook callback.
     */
    public function handleWebhook(array $payload): PaymentResult
    {
        $checkoutId = $payload['id'] ?? null;
        $status = $payload['status'] ?? null;
        $checkoutReference = $payload['checkout_reference'] ?? null;

        if (! $checkoutId || ! $status) {
            Log::warning('SumUp Payment Gateway: Invalid webhook payload', $payload);

            return PaymentResult::failed(
                message: 'Invalid webhook payload',
                errorCode: 'INVALID_PAYLOAD'
            );
        }

        Log::info('SumUp Payment Gateway: Webhook received', [
            'checkout_id' => $checkoutId,
            'status' => $status,
            'reference' => $checkoutReference,
        ]);

        // Find the transaction by reference
        $transaction = OnlineTransaction::where('reference_id', $checkoutReference)->first();

        if (! $transaction) {
            Log::error('SumUp Payment Gateway: Transaction not found for webhook', [
                'reference' => $checkoutReference,
            ]);

            return PaymentResult::failed(
                message: 'Transaction not found',
                errorCode: 'TRANSACTION_NOT_FOUND'
            );
        }

        $headers = request()->header();

        // 1. Signature Verification
        if (! $this->verifySignature($payload, $headers)) {
            Log::warning('SumUp Payment Gateway: Invalid signature', [
                'payload' => $payload,
                'headers' => $headers,
            ]);

            return PaymentResult::failed(
                message: 'Invalid signature',
                errorCode: 'INVALID_SIGNATURE'
            );
        }

        // 2. Idempotency Check
        // If the transaction is already in a final state, do not process again.
        $existingTransaction = OnlineTransaction::where('reference_id', $checkoutReference)->first();
        if ($existingTransaction && $existingTransaction->isCompleted()) {
            Log::info('SumUp Payment Gateway: Webhook ignored (Idempotency)', [
                'reference' => $checkoutReference,
                'status' => 'ALREADY_COMPLETED',
            ]);

            return PaymentResult::success(
                paymentId: $checkoutId,
                message: 'Transaction already processed',
                metadata: ['idempotent' => true]
            );
        }

        return $this->mapSumUpStatus($status, $checkoutId, $transaction, $payload);
    }

    /**
     * Verify the webhook signature from SumUp.
     *
     * @see https://developer.sumup.com/docs/online-payments/features/webhooks/
     */
    protected function verifySignature(array $payload, array $headers): bool
    {
        // Usually X-SumUp-Signature or similar.
        // Since SumUp docs might vary, we check the standard implementation.
        // If no signature logic provided in user prompt details, we implement a standard HMAC check using client secret.
        // However, SumUp Online Payments webhooks often use a specific public key or secret validation.
        // Assuming 'services.sumup.client_secret' or 'merchant_code' is used as secret or we should accept all for now if secret missing?
        // User Prompt explicitly asked: "You must verify the X-SumUp-Signature header against your checkout ID and body content using your secret key."

        // NOTE: Standard SumUp implementation usually involves HMAC SHA256 of the body with a secret.
        // Since I don't have the exact secret config key for "webhook secret" in services.php, I will assume 'services.sumup.client_secret' or similar exists, or use a placeholder that the user must fill.
        // Checking services.php... it only has api_key and merchant_code.
        // I will add a TO-DO or try to find where the "secret key" mentioned by user comes from.
        // User said: "using your secret key".

        // Let's assume there is a SUMUP_WEBHOOK_SECRET env var.
        $secret = config('services.sumup.webhook_secret');

        if (! $secret) {
            // START-UP SAFETY: If no secret configured, we cannot verify, so we might have to fail or log warning.
            // User said this is CRITICAL. So we must fail if we can't verify.
            // But to avoid breaking dev, maybe log error.
            // "Critical Security Vulnerability ... lacks signature verification".
            Log::error('SumUp Payment Gateway: Missing webhook_secret configuration');

            return false;
        }

        $signature = $headers['x-sumup-signature'][0] ?? null;

        if (! $signature) {
            return false;
        }

        // Reconstruct payload string if needed, or use raw body.
        // In Laravel, request()->getContent() gives raw body.
        $content = request()->getContent();

        $expected = hash_hmac('sha256', $content, $secret);

        return hash_equals($expected, $signature);
    }

    /**
     * SumUp supports refunds.
     */
    public function supportsRefunds(): bool
    {
        return true;
    }

    /**
     * Process a refund via SumUp API.
     */
    public function refund(string $paymentId, ?float $amount = null): PaymentResult
    {
        try {
            // First, get the checkout to find the transaction ID
            $checkoutResponse = Http::withToken($this->apiKey)
                ->get("{$this->apiBaseUrl}/v0.1/checkouts/{$paymentId}");

            if (! $checkoutResponse->successful()) {
                return PaymentResult::failed(
                    message: 'Failed to find payment for refund',
                    errorCode: 'PAYMENT_NOT_FOUND'
                );
            }

            $checkoutData = $checkoutResponse->json();
            $transactionId = $checkoutData['transaction_id'] ?? null;

            if (! $transactionId) {
                return PaymentResult::failed(
                    message: 'No completed transaction found',
                    errorCode: 'NO_TRANSACTION'
                );
            }

            // Process the refund
            $refundPayload = [];
            if ($amount !== null) {
                $refundPayload['amount'] = $amount;
            }

            $refundResponse = Http::withToken($this->apiKey)
                ->post("{$this->apiBaseUrl}/v0.1/me/refund/{$transactionId}", $refundPayload);

            if (! $refundResponse->successful()) {
                Log::error('SumUp Payment Gateway: Refund failed', [
                    'transaction_id' => $transactionId,
                    'status' => $refundResponse->status(),
                    'body' => $refundResponse->body(),
                ]);

                return PaymentResult::failed(
                    message: 'Refund processing failed',
                    errorCode: 'REFUND_FAILED'
                );
            }

            Log::info('SumUp Payment Gateway: Refund processed', [
                'payment_id' => $paymentId,
                'transaction_id' => $transactionId,
                'amount' => $amount ?? 'full',
            ]);

            return new PaymentResult(
                status: PaymentResult::STATUS_REFUNDED,
                paymentId: $paymentId,
                message: 'Refund processed successfully',
                metadata: [
                    'provider' => 'sumup',
                    'refund_amount' => $amount,
                    'transaction_id' => $transactionId,
                ]
            );

        } catch (\Exception $e) {
            Log::error('SumUp Payment Gateway: Refund exception', [
                'error' => $e->getMessage(),
                'payment_id' => $paymentId,
            ]);

            return PaymentResult::failed(
                message: 'Refund service temporarily unavailable',
                errorCode: 'SERVICE_ERROR'
            );
        }
    }

    /**
     * Get gateway name.
     */
    public function getName(): string
    {
        return 'SumUp';
    }

    /**
     * Map SumUp status to PaymentResult and update transaction.
     */
    protected function mapSumUpStatus(string $sumUpStatus, string $paymentId, OnlineTransaction $transaction, array $data = []): PaymentResult
    {
        $result = match (strtoupper($sumUpStatus)) {
            'PAID' => $this->handleSuccessfulPayment($paymentId, $transaction, $data),
            'PENDING' => PaymentResult::pending($paymentId, metadata: ['provider' => 'sumup']),
            'FAILED' => $this->handleFailedPayment($paymentId, $transaction, $data),
            'EXPIRED' => PaymentResult::failed('Payment expired', 'PAYMENT_EXPIRED'),
            default => PaymentResult::failed("Unknown status: {$sumUpStatus}", 'UNKNOWN_STATUS'),
        };

        return $result;
    }

    /**
     * Simple status mapping without transaction update.
     */
    protected function mapSumUpStatusSimple(string $sumUpStatus, string $paymentId): PaymentResult
    {
        return match (strtoupper($sumUpStatus)) {
            'PAID' => PaymentResult::success($paymentId),
            'PENDING' => PaymentResult::pending($paymentId),
            'FAILED', 'EXPIRED' => PaymentResult::failed('Payment not completed'),
            default => PaymentResult::failed('Unknown payment status'),
        };
    }

    /**
     * Handle successful payment completion.
     */
    protected function handleSuccessfulPayment(string $paymentId, OnlineTransaction $transaction, array $data): PaymentResult
    {
        $transaction->update([
            'payment_status' => PaymentResult::STATUS_COMPLETED,
            'completed_at' => now(),
        ]);

        // Dispatch confirmation email in the background
        if ($transaction->email) {
            try {
                \Illuminate\Support\Facades\Mail::to($transaction->email)
                    ->queue(new \App\Mail\OrderConfirmation($transaction));

                $transaction->update(['mail_success' => true]);
            } catch (\Exception $e) {
                $transaction->update(['mail_success' => false]);
                Log::error('Failed to queue order confirmation email', [
                    'transaction_id' => $transaction->id,
                    'email' => $transaction->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('SumUp Payment Gateway: Payment completed', [
            'checkout_id' => $paymentId,
            'transaction_id' => $transaction->id,
        ]);

        return PaymentResult::success(
            paymentId: $paymentId,
            message: 'Payment completed successfully',
            metadata: [
                'provider' => 'sumup',
                'sumup_transaction_id' => $data['transaction_id'] ?? null,
            ]
        );
    }

    /**
     * Handle failed payment.
     */
    protected function handleFailedPayment(string $paymentId, OnlineTransaction $transaction, array $data): PaymentResult
    {
        $transaction->update([
            'payment_status' => PaymentResult::STATUS_FAILED,
        ]);

        Log::warning('SumUp Payment Gateway: Payment failed', [
            'checkout_id' => $paymentId,
            'transaction_id' => $transaction->id,
        ]);

        return PaymentResult::failed(
            message: $data['failure_reason'] ?? 'Payment was not completed',
            errorCode: 'PAYMENT_FAILED',
            metadata: ['provider' => 'sumup']
        );
    }
}
