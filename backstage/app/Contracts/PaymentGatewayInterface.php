<?php

namespace App\Contracts;

use App\Models\OnlineTransaction;

/**
 * Payment Gateway Interface
 *
 * Defines the contract for payment processing implementations.
 * Development environments use a mock implementation that auto-completes payments.
 * Production environments use real payment providers (e.g., SumUp).
 */
interface PaymentGatewayInterface
{
    /**
     * Create a new payment session/checkout for the given transaction.
     *
     * @param  OnlineTransaction  $transaction  The transaction to create a payment for
     * @param  array  $metadata  Additional metadata for the payment (items, customer info, etc.)
     * @return PaymentResult Contains checkout URL, payment ID, and status
     */
    public function createPayment(OnlineTransaction $transaction, array $metadata = []): PaymentResult;

    /**
     * Verify and complete a payment after customer interaction.
     *
     * @param  string  $paymentId  The external payment ID returned by the gateway
     * @param  OnlineTransaction  $transaction  The associated transaction
     * @return PaymentResult Contains the updated status and any error messages
     */
    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult;

    /**
     * Get the current status of a payment.
     *
     * @param  string  $paymentId  The external payment ID
     * @return PaymentResult Contains the current status
     */
    public function getPaymentStatus(string $paymentId): PaymentResult;

    /**
     * Handle webhook/callback from the payment provider.
     *
     * @param  array  $payload  The webhook payload from the provider
     * @return PaymentResult Contains the processing result
     */
    public function handleWebhook(array $payload): PaymentResult;

    /**
     * Check if the gateway supports refunds.
     */
    public function supportsRefunds(): bool;

    /**
     * Process a refund for a completed payment.
     *
     * @param  string  $paymentId  The external payment ID
     * @param  float  $amount  The amount to refund (null for full refund)
     * @return PaymentResult Contains the refund status
     */
    public function refund(string $paymentId, ?float $amount = null): PaymentResult;

    /**
     * Get the name of the payment gateway for logging/display purposes.
     */
    public function getName(): string;
}
