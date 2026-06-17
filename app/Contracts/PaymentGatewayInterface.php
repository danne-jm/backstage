<?php

namespace App\Contracts;

use App\DTOs\Storefront\PaymentResult;
use App\Models\Transaction;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Initiate a payment session and return the checkout URL.
     */
    public function createPayment(Transaction $transaction): PaymentResult;

    /**
     * Verify the status of an existing payment.
     */
    public function verifyPayment(string $paymentId): PaymentResult;

    /**
     * Handle incoming webhook requests from the gateway.
     */
    public function handleWebhook(Request $request): void;

    /**
     * Verify that the webhook signature matches the gateway's secret.
     */
    public function isWebhookSignatureValid(Request $request): bool;

    /**
     * Refund a completed transaction.
     */
    public function refund(Transaction $transaction): PaymentResult;
}
