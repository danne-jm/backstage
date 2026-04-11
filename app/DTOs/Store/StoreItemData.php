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
        public ?string $available_from,
    ) {
    }

    public static function fromProduct(Product $product): self
    {
        $isVariantBased = (bool) $product->is_variant_based;

        // Use price_with_card / price_without_card when set; fall back to legacy member_price.
        $priceWithCard = $product->price_with_card !== null ? (float) $product->price_with_card : null;
        $legacyMemberPrice = $product->member_price !== null ? (float) $product->member_price : null;
        $priceWithoutCard = $product->price_without_card !== null ? (float) $product->price_without_card : null;
        $basePrice = $priceWithoutCard ?? (float) $product->price;

        // Resolve member_price: use price_with_card when it's a real discount, else null.
        $candidateMemberPrice = $priceWithCard ?? $legacyMemberPrice;
        $memberPrice = ($candidateMemberPrice !== null && $candidateMemberPrice > 0 && $candidateMemberPrice < $basePrice)
            ? $candidateMemberPrice
            : null;

        $withCardStock = $product->checkHasStockWithCard();
        $withoutCardStock = $product->checkHasStockWithoutCard();
        $hasStock = $product->checkHasStock();

        $variants = collect($product->variants ?? [])
            ->map(fn($v) => StoreVariantData::fromVariant($v)->toArray())
            ->values()
            ->all();

        $images = collect($product->images_list ?? [])
            ->map(fn($img) => ['id' => $img['id'], 'url' => $img['url']])
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
            has_stock_with_card: $withCardStock,
            has_stock_without_card: $withoutCardStock,
            instagram_link: $product->instagram_link,
            images: $images,
            available_from: ($product->start_sell_date && $product->start_sell_date->isFuture())
                ? $product->start_sell_date->toIso8601String()
                : null,
        );
    }

    public static function fromEvent(Event $event): self
    {
        $priceWithoutCard = (float) ($event->price_without_card ?? 0);
        $priceWithCard = (float) ($event->price_with_card ?? 0);
        $isVariable = (bool) $event->variable_amount;

        $withCardStock = $event->checkHasStockWithCard();
        $withoutCardStock = $event->checkHasStockWithoutCard();

        $hasStock = $isVariable
            ? ($withCardStock || $withoutCardStock)
            : $event->checkHasStock();

        $images = collect($event->images_list ?? [])
            ->map(fn($img) => ['id' => $img['id'], 'url' => $img['url']])
            ->values()
            ->all();

        $hasDiscount = ($priceWithCard > 0 && $priceWithCard < $priceWithoutCard);

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
            member_price: $hasDiscount ? $priceWithCard : null,
            price_without_card: $hasDiscount ? $priceWithoutCard : null,
            is_variant_based: false,
            variants_config: null,
            variants: [],
            has_stock_with_card: $withCardStock,
            has_stock_without_card: $withoutCardStock,
            instagram_link: $event->instagram_link,
            images: $images,
            available_from: ($event->start_sell_date && $event->start_sell_date->isFuture())
                ? $event->start_sell_date->toIso8601String()
                : null,
        );
    }

    public function toArray(): array
    {
        $comingSoon = $this->available_from !== null;

        return [
            'id'                    => $this->id,
            'type'                  => $this->type,
            'name'                  => $this->name,
            'description'           => $this->description,
            'image'                 => $this->image,
            'images'                => $this->images,
            'event_date'            => $this->event_date,
            'instagram_link'        => $this->instagram_link,
            'available_from'        => $this->available_from,
            // Price / stock / structure fields are withheld until the sale goes live.
            'price'                 => $comingSoon ? null : $this->price,
            'member_price'          => $comingSoon ? null : $this->member_price,
            'price_without_card'    => $comingSoon ? null : $this->price_without_card,
            'has_stock'             => $comingSoon ? null : $this->has_stock,
            'is_variable'           => $comingSoon ? null : $this->is_variable,
            'is_variant_based'      => $comingSoon ? null : $this->is_variant_based,
            'variants_config'       => $comingSoon ? null : $this->variants_config,
            'variants'              => $comingSoon ? [] : $this->variants,
            'has_stock_with_card'   => $comingSoon ? null : $this->has_stock_with_card,
            'has_stock_without_card'=> $comingSoon ? null : $this->has_stock_without_card,
        ];
    }
}
