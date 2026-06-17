<?php

namespace App\Services;

use App\Models\Event;
use App\Models\Product;
use Illuminate\Support\Collection;

class InventoryService
{
    /**
     * Get all sellable products with their current status.
     */
    public function getSellableProducts(): Collection
    {
        $products = Product::withCount(['sales', 'onlineSales'])
            ->with(['variants'])
            ->orderBy('name')
            ->get();

        return $products->map(function ($product) {
            return [
                'id' => 'product_'.$product->id,
                'actual_id' => $product->id,
                'type' => 'product',
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'remaining' => $product->remaining,
                'is_variant_based' => (bool) $product->is_variant_based,
                'variants' => $product->variants->map(function ($v) use ($product) {
                    return [
                        'id' => $v->id,
                        'options' => $v->options,
                        'remaining' => $v->remaining,
                        'price' => $v->price ?? $product->price,
                    ];
                }),
                'unlimited_quantity' => (bool) ($product->unlimited_quantity ?? false),
                'unlimited_quantity_with_card' => (bool) ($product->unlimited_quantity_with_card ?? false),
                'unlimited_quantity_without_card' => (bool) ($product->unlimited_quantity_without_card ?? false),
            ];
        });
    }

    /**
     * Get all currently sellable events.
     */
    public function getSellableEvents(): Collection
    {
        $events = Event::withCount([
            'sales',
            'onlineSales',
            'sales as sales_with_card_count' => function ($query) {
                $query->where('snapshot->ticket_type', 'with_card');
            },
            'sales as sales_without_card_count' => function ($query) {
                $query->where('snapshot->ticket_type', 'without_card');
            },
            'onlineSales as online_sales_with_card_count' => function ($query) {
                $query->where('details->ticket_type', 'with_card');
            },
            'onlineSales as online_sales_without_card_count' => function ($query) {
                $query->where('details->ticket_type', 'without_card');
            },
        ])->where(function ($query) {
            $now = now();
            $query->where(function ($q) use ($now) {
                $q->where('start_sell_date', '<=', $now)
                    ->orWhereNull('start_sell_date');
            });
            $query->where(function ($q) use ($now) {
                $q->where('end_sell_date', '>=', $now)
                    ->orWhereNull('end_sell_date');
            });
        })
            ->orderBy('event_date', 'asc')
            ->get();

        return $events->map(function ($event) {
            return [
                'id' => 'event_'.$event->id,
                'actual_id' => $event->id,
                'type' => 'event',
                'name' => $event->name,
                'description' => $event->description,
                'event_date' => $event->event_date,
                'start_sell_date' => $event->start_sell_date,
                'end_sell_date' => $event->end_sell_date,
                'price_with_card' => $event->price_with_card,
                'price_without_card' => $event->price_without_card,
                'remaining' => $event->remaining,
                'unlimited_quantity' => (bool) ($event->unlimited_quantity ?? false),
                'remaining_with_card' => $event->remaining_with_card,
                'unlimited_quantity_with_card' => (bool) ($event->unlimited_quantity_with_card ?? false),
                'remaining_without_card' => $event->remaining_without_card,
                'unlimited_quantity_without_card' => (bool) ($event->unlimited_quantity_without_card ?? false),
                'variable_amount' => $event->variable_amount,
            ];
        });
    }

    /**
     * Get a combined collection of all sellables (products + events).
     */
    public function getAllSellables(): Collection
    {
        return $this->getSellableProducts()->concat($this->getSellableEvents());
    }
}
