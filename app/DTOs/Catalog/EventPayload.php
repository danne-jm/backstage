<?php

namespace App\DTOs\Catalog;

use DateTimeInterface;

readonly class EventPayload
{
    public function __construct(
        public string $name,
        public string $description,
        public ?DateTimeInterface $eventDate = null,
        public ?DateTimeInterface $startSellDate = null,
        public ?DateTimeInterface $endSellDate = null,
        public bool $isOnlineSellable = false,
        public bool $hideUntilSale = false,
        
        // Pricing
        public float $priceWithoutMembership = 0.0,
        public float $priceWithMembership = 0.0,
        public bool $variableAmount = false,

        // Stock
        public bool $unlimitedQuantity = true,
        public ?int $quantity = null,
        public bool $unlimitedQuantityWithMembership = true,
        public ?int $quantityWithMembership = null,
        public bool $unlimitedQuantityWithoutMembership = true,
        public ?int $quantityWithoutMembership = null,

        // Variants
        public bool $isVariantBased = false,
        public ?array $variantsConfig = null,

        // Integrations
        public ?string $googleSpreadsheetId = null,
        public ?string $googleSheetName = null,
        public ?array $attendeeFilterConfig = null,
        
        // Access
        public ?array $responsibleUserIds = null
    ) {}
}
