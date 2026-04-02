<?php

namespace App\Contracts;

use App\Models\OnlineTransaction;

interface PaymentGatewayInterface
{
    public function createPayment(OnlineTransaction $transaction, array $metadata = []): PaymentResult;

    public function verifyPayment(string $paymentId, OnlineTransaction $transaction): PaymentResult;

    public function getPaymentStatus(string $paymentId): PaymentResult;

    public function handleWebhook(array $payload): PaymentResult;

    public function supportsRefunds(): bool;

    public function refund(string $paymentId, ?float $amount = null): PaymentResult;

    public function getName(): string;
}
