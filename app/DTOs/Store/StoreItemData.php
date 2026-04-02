<?php

namespace App\DTOs\Store;

use App\Models\sellables\Event;
use App\Models\sellables\Product;

readonly class StoreItemData
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
        // Detail/cart extras
        public bool $is_variant_based,
        public ?array $variants_config,
        public array $variants,
        public bool $has_stock_with_card,
        public bool $has_stock_without_card,
        public ?string $instagram_link,
        public array $images,
    ) {}

    public static function fromProduct(Product $product): self
    {
        $isVariantBased = (bool) $product->is_variant_based;

        // Use price_with_card / price_without_card when set; fall back to legacy member_price.
        // ESNcard pricing only applies to non-variant products.
        $priceWithCard    = $product->price_with_card    ? (float) $product->price_with_card    : null;
        $priceWithoutCard = $product->price_without_card ? (float) $product->price_without_card : null;
        $basePrice        = $priceWithoutCard ?? (float) $product->price;

        // Resolve member_price: use price_with_card when it's a real discount, else null.
        $memberPrice = (!$isVariantBased && $priceWithCard !== null && $priceWithCard > 0 && $priceWithCard < $basePrice)
            ? $priceWithCard
            : null;

        $hasStock = $product->unlimited_quantity
            || is_null($product->quantity)
            || ($product->quantity - ($product->sold_count ?? 0)) > 0;

        $variants = collect($product->variants ?? [])
            ->map(fn ($v) => StoreVariantData::fromVariant($v)->toArray())
            ->values()
            ->all();

        $images = collect($product->images_list ?? [])
            ->map(fn ($img) => ['id' => $img['id'], 'url' => $img['url']])
            ->values()
            ->all();

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
            is_variant_based: $isVariantBased,
            variants_config: $product->variants_config,
            variants: $variants,
            has_stock_with_card: false,
            has_stock_without_card: false,
            instagram_link: $product->instagram_link,
            images: $images,
        );
    }

    public static function fromEvent(Event $event): self
    {
        $priceWithoutCard = (float) ($event->price_without_card ?? 0);
        $priceWithCard = (float) ($event->price_with_card ?? 0);
        $isVariable = (bool) $event->variable_amount;

        $withCardStock = $event->unlimited_quantity_with_card
            || is_null($event->quantity_with_card)
            || ($event->quantity_with_card - ($event->sold_count_with_card ?? 0)) > 0;

        $withoutCardStock = $event->unlimited_quantity_without_card
            || is_null($event->quantity_without_card)
            || ($event->quantity_without_card - ($event->sold_count_without_card ?? 0)) > 0;

        if ($isVariable) {
            $hasStock = $withCardStock || $withoutCardStock;
        } else {
            $hasStock = $event->unlimited_quantity
                || is_null($event->quantity)
                || ($event->quantity - ($event->sold_count_without_card ?? 0)) > 0;
        }

        $images = collect($event->images_list ?? [])
            ->map(fn ($img) => ['id' => $img['id'], 'url' => $img['url']])
            ->values()
            ->all();

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
            is_variant_based: false,
            variants_config: null,
            variants: [],
            has_stock_with_card: $withCardStock,
            has_stock_without_card: $withoutCardStock,
            instagram_link: $event->instagram_link,
            images: $images,
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
            'is_variant_based' => $this->is_variant_based,
            'variants_config' => $this->variants_config,
            'variants' => $this->variants,
            'has_stock_with_card' => $this->has_stock_with_card,
            'has_stock_without_card' => $this->has_stock_without_card,
            'instagram_link' => $this->instagram_link,
            'images' => $this->images,
        ];
    }
}
