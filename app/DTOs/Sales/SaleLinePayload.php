<?php

namespace App\DTOs\Sales;

readonly class SaleLinePayload
{
    /**
     * @param array<string, mixed>|null $snapshot
     */
    public function __construct(
        public string $purchasableId,
        public string $purchasableType,
        public float $unitPrice,
        public int $quantity,
        public float $subtotal,
        public string $ticketType = 'regular',
        public ?string $variantId = null,
        public ?array $snapshot = null,
        public ?string $discountCodeUsed = null,
    ) {}
}
