<?php

namespace App\DTOs\Sales;

readonly class TransactionPayload
{
    /**
     * @param  array<string, mixed>|null  $cashTenderedBreakdown
     * @param  array<string, mixed>|null  $cashChangeBreakdown
     */
    public function __construct(
        public string $channel,
        public string $paymentMethod,
        public float $totalAmount,
        public float $discountTotal = 0.0,
        public string $status = 'pending',
        public ?string $officeShiftId = null,
        public ?string $customerEmail = null,
        public ?string $externalPaymentId = null,
        public ?float $cashTenderedAmount = null,
        public ?float $cashChangeAmount = null,
        public ?array $cashTenderedBreakdown = null,
        public ?array $cashChangeBreakdown = null,
    ) {}
}
