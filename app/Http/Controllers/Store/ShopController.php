<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class ShopController extends Controller
{
    public function index()
    {
        $now = now();

        $data = \Illuminate\Support\Facades\Cache::remember('shop_index', 30, function () use ($now) {
            $events = \App\Models\Event::where('start_sell_date', '<=', $now)
                ->where('end_sell_date', '>=', $now)
                ->where('is_online_sellable', true)
                ->orderBy('event_date', 'asc')
                ->get()
                ->map(function ($event) {
                    return $this->formatEventForExplore($event);
                });

            $products = \App\Models\Product::where('is_online_sellable', true)
                ->orderBy('name')
                ->get()
                ->map(function ($product) {
                    return $this->formatProductForExplore($product);
                });

            return [
                'sellables' => $events->concat($products),
            ];
        });

        return Inertia::render('Store/home', $data);
    }

    public function show(string $type, string $id)
    {
        $cacheKey = "shop_item_{$type}_{$id}";

        $item = \Illuminate\Support\Facades\Cache::remember($cacheKey, 60, function () use ($type, $id) {
            if ($type === 'event') {
                $event = \App\Models\Event::where('id', $id)
                    ->where('is_online_sellable', true)
                    ->firstOrFail();

                return $this->formatEventForExplore($event);
            } elseif ($type === 'product') {
                $product = \App\Models\Product::where('id', $id)
                    ->where('is_online_sellable', true)
                    ->firstOrFail();

                return $this->formatProductForExplore($product);
            }

            return null;
        });

        if (! $item) {
            abort(404);
        }

        return Inertia::render('Store/show', [
            'item' => $item,
        ]);
    }

    public function cart()
    {
        $now = now();

        $events = \App\Models\Event::where('start_sell_date', '<=', $now)
            ->where('end_sell_date', '>=', $now)
            ->where('is_online_sellable', true)
            ->get()
            ->map(fn ($e) => $this->formatEventForExplore($e));

        $products = \App\Models\Product::where('is_online_sellable', true)
            ->get()
            ->map(fn ($p) => $this->formatProductForExplore($p));

        return Inertia::render('Store/cart', [
            'sellables' => $events->concat($products),
            'processingFeeRate' => config('services.sumup.processing_fee_rate', 0.02),
        ]);
    }

    private function formatEventForExplore($event)
    {
        if ($event->variable_amount) {
            $remaining = $event->remaining_with_card;
            $isUnlimited = $event->unlimited_quantity_with_card || is_null($event->quantity_with_card);
        } else {
            $remaining = $event->remaining;
            $isUnlimited = $event->unlimited_quantity || is_null($event->quantity);
        }

        // If unlimited, we enforce true here for frontend clarity
        if ($isUnlimited) {
            $remaining = null;
        }

        // Only include variants if variants_config is not null/empty AND is_variant_based is true
        $hasVariants = $event->is_variant_based && ! empty($event->variants_config);

        return [
            'id' => $event->id,
            'is_variant_based' => $event->is_variant_based,
            'type' => 'event',
            'name' => $event->name,
            'description' => $event->description,
            'image' => $event->image ?? '/images/event1.jpg',
            'images' => $event->images_list,
            'event_date' => $event->event_date,
            'price' => $event->price_without_card ?? $event->price_with_card,
            'member_price' => $event->price_with_card,
            'price_without_card' => $event->price_without_card,
            'is_variable' => $event->variable_amount,
            'remaining' => $remaining,
            'remaining_with_card' => $event->remaining_with_card,
            'remaining_without_card' => $event->remaining_without_card,
            'unlimited' => $isUnlimited,
            'unlimited_with_card' => $event->unlimited_quantity_with_card,
            'unlimited_without_card' => $event->unlimited_quantity_without_card,
            'instagram_link' => $event->instagram_link,
            'is_online_sellable' => $event->is_online_sellable,
            'variants_config' => $hasVariants ? $event->variants_config : null,
            'variants' => $hasVariants ? $event->variants : null,
        ];
    }

    private function formatProductForExplore($product)
    {
        $remaining = $product->quantity_with_card ?? $product->quantity;
        $isUnlimited = ($product->unlimited_quantity_with_card ?? $product->unlimited_quantity) || is_null($product->quantity);

        if ($isUnlimited) {
            $remaining = null;
        }

        // Only include variants if variants_config is not null/empty AND is_variant_based is true
        $hasVariants = $product->is_variant_based && ! empty($product->variants_config);

        return [
            'id' => $product->id,
            'is_variant_based' => $product->is_variant_based,
            'type' => 'product',
            'name' => $product->name,
            'description' => $product->description,
            'image' => $product->image ?? '/images/product.png',
            'images' => $product->images_list,
            'price' => $product->price,
            'member_price' => $product->price,
            'remaining' => $remaining,
            'unlimited' => $isUnlimited,
            'instagram_link' => $product->instagram_link,
            'is_online_sellable' => $product->is_online_sellable,
            'variants_config' => $hasVariants ? $product->variants_config : null,
            'variants' => $hasVariants ? $product->variants : null,
        ];
    }
}
