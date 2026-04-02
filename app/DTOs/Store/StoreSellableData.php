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

        $hasStock = $product->unlimited_quantity
            || is_null($product->quantity)
            || ($product->quantity - ($product->sold_count ?? 0)) > 0;

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
        );
    }

    public static function fromEvent(Event $event): self
    {
        $priceWithoutCard = (float) ($event->price_without_card ?? 0);
        $priceWithCard = (float) ($event->price_with_card ?? 0);
        $isVariable = (bool) $event->variable_amount;

        if ($isVariable) {
            // Variable event: at least one tier must have stock
            $withCardStock = $event->unlimited_quantity_with_card
                || is_null($event->quantity_with_card)
                || ($event->quantity_with_card - ($event->sold_count_with_card ?? 0)) > 0;

            $withoutCardStock = $event->unlimited_quantity_without_card
                || is_null($event->quantity_without_card)
                || ($event->quantity_without_card - ($event->sold_count_without_card ?? 0)) > 0;

            $hasStock = $withCardStock || $withoutCardStock;
        } else {
            $hasStock = $event->unlimited_quantity
                || is_null($event->quantity)
                || ($event->quantity - ($event->sold_count_without_card ?? 0)) > 0;
        }

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
        ];
    }
}
