<?php

namespace App\DTOs\Office;

use App\Models\sellables\Product;
use App\Models\sellables\Event;

readonly class PosSellableDTO
{
    public static function fromProduct(Product $product): array
    {
        return [
            'actual_id' => $product->id,
            'unique_id' => 'product-' . $product->id,
            'type' => 'product',
            'name' => $product->name,
            'description' => $product->description,
            'price' => (float) $product->price,
            'price_with_card' => null,
            'price_without_card' => null,
            'is_variant_based' => (bool) $product->is_variant_based,
            'has_stock' => $product->checkHasStock(),
            'unlimited_quantity' => $product->unlimited_quantity,
            'remaining' => $product->computedRemaining(),
            'start_sell_date' => $product->start_sell_date,
            'end_sell_date' => $product->end_sell_date,
            'variants_config' => $product->variants_config,
            'variants' => $product->variants->map(fn($v) => [
                'id' => $v->id,
                'name' => 'Variant ' . $v->id,
                'options' => $v->options,
                'remaining' => $v->computedRemaining(),
                'has_stock' => $v->quantity === null || $v->computedRemaining() > 0,
            ])
        ];
    }

    public static function fromEvent(Event $event): array
    {
        return [
            'actual_id' => $event->id,
            'unique_id' => 'event-' . $event->id,
            'type' => 'event',
            'name' => $event->name,
            'description' => $event->description,
            'price' => null,
            'price_with_card' => $event->price_with_card ? (float) $event->price_with_card : null,
            'price_without_card' => $event->price_without_card ? (float) $event->price_without_card : null,
            'is_variant_based' => (bool) $event->is_variant_based,
            'variable_amount' => (bool) $event->variable_amount,
            'unlimited_quantity_with_card' => $event->unlimited_quantity_with_card,
            'unlimited_quantity_without_card' => $event->unlimited_quantity_without_card,
            'unlimited_quantity' => $event->unlimited_quantity,
            'remaining_with_card' => $remainingWithCard = $event->computedRemainingWithCard(),
            'remaining_without_card' => $remainingWithoutCard = $event->computedRemainingWithoutCard(),
            'remaining' => $remainingWithoutCard,
            'start_sell_date' => $event->start_sell_date,
            'end_sell_date' => $event->end_sell_date,
            'has_stock' => $event->checkHasStock(),
            'variants_config' => $event->variants_config,
            'variants' => $event->variants->map(fn($v) => [
                'id' => $v->id,
                'options' => $v->options,
                'remaining' => $v->computedRemaining(),
                'has_stock' => $v->quantity === null || $v->computedRemaining() > 0,
            ])
        ];
    }
}
