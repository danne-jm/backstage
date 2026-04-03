<?php

namespace App\DTOs\Store;

use App\Models\SellableVariant;

readonly class StoreVariantData
{
    public function __construct(
        public string $id,
        public array $options,
        public bool $has_stock,
    ) {
    }

    public static function fromVariant(SellableVariant $variant): self
    {
        $remaining = $variant->computedRemaining();
        $hasStock = is_null($variant->quantity) || ($remaining !== null && $remaining > 0);

        return new self(
            id: $variant->id,
            options: $variant->options ?? [],
            has_stock: $hasStock,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'options' => $this->options,
            'has_stock' => $this->has_stock,
        ];
    }
}
