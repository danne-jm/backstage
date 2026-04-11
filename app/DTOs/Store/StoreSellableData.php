<?php

namespace App\DTOs\Store;

use App\Models\sellables\Event;
use App\Models\sellables\Product;

readonly class StoreSellableData
{
    public function __construct(
        public string $id,
        public string $type,
        public string $name,
        public ?string $description,
        public ?string $image,
        public float $price,
        public bool $has_stock,
        public bool $is_variable,
        public ?string $event_date,
        public ?float $member_price,
        public ?float $price_without_card,
        public ?string $available_from,
    ) {}

    public static function fromProduct(Product $product): self
    {
        $isVariantBased   = (bool) $product->is_variant_based;
        $priceWithCard    = $product->price_with_card    ? (float) $product->price_with_card    : null;
        $priceWithoutCard = $product->price_without_card ? (float) $product->price_without_card : null;
        $basePrice        = $priceWithoutCard ?? (float) $product->price;

        $memberPrice = (!$isVariantBased && $priceWithCard !== null && $priceWithCard > 0 && $priceWithCard < $basePrice)
            ? $priceWithCard
            : null;

        $hasStock = $product->checkHasStockWithCard() || $product->checkHasStockWithoutCard();
        $availableFrom = ($product->start_sell_date && $product->start_sell_date->isFuture())
            ? $product->start_sell_date->toIso8601String()
            : null;

        return new self(
            id: $product->id,
            type: 'product',
            name: $product->name,
            description: $product->description,
            image: $product->image,
            price: $basePrice,
            has_stock: $hasStock,
            is_variable: false,
            event_date: null,
            member_price: $memberPrice,
            price_without_card: ($memberPrice !== null) ? $basePrice : null,
            available_from: $availableFrom,
        );
    }

    public static function fromEvent(Event $event): self
    {
        $priceWithoutCard = (float) ($event->price_without_card ?? 0);
        $priceWithCard = (float) ($event->price_with_card ?? 0);
        $isVariable = (bool) $event->variable_amount;

        $hasStock = $isVariable
            ? ($event->checkHasStockWithCard() || $event->checkHasStockWithoutCard())
            : $event->checkHasStock();

        $availableFrom = ($event->start_sell_date && $event->start_sell_date->isFuture())
            ? $event->start_sell_date->toIso8601String()
            : null;

        return new self(
            id: $event->id,
            type: 'event',
            name: $event->name,
            description: $event->description,
            image: $event->image,
            price: $priceWithoutCard,
            has_stock: $hasStock,
            is_variable: $isVariable,
            event_date: $event->event_date?->toIso8601String(),
            member_price: ($priceWithCard > 0 && $priceWithCard < $priceWithoutCard) ? $priceWithCard : null,
            price_without_card: $isVariable ? $priceWithoutCard : null,
            available_from: $availableFrom,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image,
            'price' => $this->price,
            'has_stock' => $this->has_stock,
            'is_variable' => $this->is_variable,
            'event_date' => $this->event_date,
            'member_price' => $this->member_price,
            'price_without_card' => $this->price_without_card,
            'available_from' => $this->available_from,
        ];
    }
}
