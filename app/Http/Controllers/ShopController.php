<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class ShopController extends Controller
{
    public function index()
    {
        $now = now();

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

        return Inertia::render('shop/home', [
            'sellables' => $events->concat($products),
        ]);
    }

    public function show(string $type, string $id)
    {
        if ($type === 'event') {
            $event = \App\Models\Event::where('id', $id)
                ->where('is_online_sellable', true)
                ->firstOrFail();

            return Inertia::render('shop/show', [
                'item' => $this->formatEventForExplore($event),
            ]);
        } elseif ($type === 'product') {
            $product = \App\Models\Product::where('id', $id)
                ->where('is_online_sellable', true)
                ->firstOrFail();

            return Inertia::render('shop/show', [
                'item' => $this->formatProductForExplore($product),
            ]);
        }

        abort(404);
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

        return Inertia::render('shop/cart', [
            'sellables' => $events->concat($products),
        ]);
    }

    private function formatEventForExplore($event)
    {
        // Null remaining means unlimited in our logic if quantity_with_card is null
        $remaining = $event->remaining_with_card;
        $isUnlimited = $event->unlimited_quantity_with_card || is_null($event->quantity_with_card);

        // If unlimited, we enforce true here for frontend clarity
        if ($isUnlimited) {
            $remaining = null;
        }

        return [
            'id' => $event->id,
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
            'unlimited' => $isUnlimited,
            'instagram_link' => $event->instagram_link,
        ];
    }

    private function formatProductForExplore($product)
    {
        $remaining = $product->quantity_with_card ?? $product->quantity;
        $isUnlimited = ($product->unlimited_quantity_with_card ?? $product->unlimited_quantity) || is_null($product->quantity);

        if ($isUnlimited) {
            $remaining = null;
        }

        return [
            'id' => $product->id,
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
        ];
    }
}
