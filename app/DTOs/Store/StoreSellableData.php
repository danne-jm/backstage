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
        $price = (float) $product->price;
        $memberPrice = $product->member_price !== null ? (float) $product->member_price : null;

        $hasStock = $product->unlimited_quantity
            || is_null($product->quantity)
            || ($product->quantity - ($product->sold_count ?? 0)) > 0;

        return new self(
            id: $product->id,
            type: 'product',
            name: $product->name,
            description: $product->description,
            image: $product->image,
            price: $price,
            has_stock: $hasStock,
            is_variable: false,
            event_date: null,
            member_price: ($memberPrice !== null && $memberPrice < $price) ? $memberPrice : null,
            price_without_card: null,
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
