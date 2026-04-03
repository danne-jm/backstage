<?php

namespace App\Services;

use App\Contracts\PaymentGatewayInterface;
use App\Contracts\PaymentResult;
use App\Models\OnlineTransaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SumUp payment gateway integration.
 * Requires SUMUP_API_KEY, SUMUP_APP_ID, and SUMUP_MERCHANT_CODE env variables.
 */
class SumUpPaymentGateway implements PaymentGatewayInterface
{
    private const API_BASE = 'https://api.sumup.com/v0.1';

    public function __construct(
        private ?string $apiKey = null,
        private ?string $merchantCode = null,
        private ?string $webhookSecret = null,
    ) {
        $this->apiKey = $apiKey ?? config('services.sumup.api_key');
        $this->merchantCode = $merchantCode ?? config('services.sumup.merchant_code');
        $this->webhookSecret = $webhookSecret ?? config('services.sumup.webhook_secret');
    }

    public function createPayment(OnlineTransaction $transaction, array $metadata = []): PaymentResult
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->post(self::API_BASE . '/checkouts', [
                    'checkout_reference' => $transaction->reference_id,
                    'amount' => (float) $transaction->total_amount,
                    'currency' => 'EUR',
                    'merchant_code' => $this->merchantCode,
                    'description' => 'Online Store Order',
                    'return_url' => url('/payment/callback'),
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $checkoutId = $data['id'] ?? null;
                $checkoutUrl = "https://pay.sumup.com/b2c/QLPBDVUN?co={$checkoutId}";

                $transaction->update([
                    'external_payment_id' => $checkoutId,
                ]);

                return PaymentResult::pending($checkoutId, $checkoutUrl);
            }

            Log::error('SumUp createPayment failed', [
                'status' => $response->status(),
                'body' => $response->body(),
                'transaction_id' => $transaction->id,
            ]);

            return PaymentResult::failed('Payment creation failed', (string) $response->status());
        } catch (\Throwable $e) {
            Log::error('SumUp createPayment exception', ['error' => $e->getMessage()]);

            return PaymentResult::failed($e->getMessage());
        }
    }

    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->get(self::API_BASE . "/checkouts/{$paymentId}");

            if (!$response->successful()) {
                return PaymentResult::failed('Could not verify payment');
            }

            $data = $response->json();
            $status = strtolower($data['status'] ?? '');

            if ($status === 'paid') {
                $transaction->update([
                    'payment_status' => 'completed',
                    'completed_at' => now(),
                ]);

                return PaymentResult::success($paymentId);
            }

            if (in_array($status, ['failed', 'cancelled'])) {
                return PaymentResult::failed('Payment ' . $status, $status);
            }

            return PaymentResult::pending($paymentId);
        } catch (\Throwable $e) {
            Log::error('SumUp verifyPayment exception', ['error' => $e->getMessage()]);

            return PaymentResult::failed($e->getMessage());
        }
    }

    public function getPaymentStatus(string $paymentId): PaymentResult
    {
        return $this->verifyPayment($paymentId, new \App\Models\OnlineTransaction);
    }

    public function handleWebhook(array $payload): PaymentResult
    {
        $eventType = $payload['event_type'] ?? '';
        $checkoutId = $payload['id'] ?? null;

        if ($eventType === 'CHECKOUT_STATUS_CHANGED' && ($payload['status'] ?? '') === 'PAID') {
            return PaymentResult::success($checkoutId);
        }

        return PaymentResult::pending($checkoutId ?? '');
    }

    /**
     * Verify the SumUp webhook signature.
     * The signature is a SHA256 HMAC of the request body using the secret key.
     */
    public function isWebhookSignatureValid(string $body, string $signature): bool
    {
        if (!$this->webhookSecret) {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $body, $this->webhookSecret);

        return hash_equals($expectedSignature, $signature);
    }

    public function supportsRefunds(): bool
    {
        return true;
    }

    public function refund(string $paymentId, ?float $amount = null): PaymentResult
    {
        try {
            $body = $amount !== null ? ['amount' => $amount] : [];

            $response = Http::withToken($this->apiKey)
                ->post(self::API_BASE . "/me/refund/{$paymentId}", $body);

            if ($response->successful()) {
                return PaymentResult::success($paymentId, 'Refund processed');
            }

            return PaymentResult::failed('Refund failed', (string) $response->status());
        } catch (\Throwable $e) {
            return PaymentResult::failed($e->getMessage());
        }
    }

    public function getName(): string
    {
        return 'sumup';
    }
}
