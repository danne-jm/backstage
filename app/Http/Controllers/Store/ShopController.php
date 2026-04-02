<?php

namespace App\Http\Controllers\Store;

use App\DTOs\Store\StoreItemData;
use App\DTOs\Store\StoreSellableData;
use App\Http\Controllers\Controller;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class ShopController extends Controller
{
    public function index()
    {
        $now = now();

        $data = Cache::remember('shop_index', 30, function () use ($now) {
            $events = Event::where('start_sell_date', '<=', $now)
                ->where('end_sell_date', '>=', $now)
                ->where('is_online_sellable', true)
                ->orderBy('event_date', 'asc')
                ->get()
                ->map(fn ($e) => StoreSellableData::fromEvent($e)->toArray());

            $products = Product::where('is_online_sellable', true)
                ->orderBy('name')
                ->get()
                ->map(fn ($p) => StoreSellableData::fromProduct($p)->toArray());

            return ['sellables' => $events->concat($products)->values()];
        });

        return Inertia::render('home', $data);
    }

    public function show(string $type, string $id)
    {
        $cacheKey = "shop_item_{$type}_{$id}";

        $item = Cache::remember($cacheKey, 60, function () use ($type, $id) {
            if ($type === 'event') {
                $event = Event::with('variants')
                    ->where('id', $id)
                    ->where('is_online_sellable', true)
                    ->firstOrFail();

                return StoreItemData::fromEvent($event)->toArray();
            }

            if ($type === 'product') {
                $product = Product::with('variants')
                    ->where('id', $id)
                    ->where('is_online_sellable', true)
                    ->firstOrFail();

                return StoreItemData::fromProduct($product)->toArray();
            }

            return null;
        });

        if (! $item) {
            abort(404);
        }

        return Inertia::render('show', ['item' => $item]);
    }

    public function cart()
    {
        $now = now();

        $events = Event::with('variants')
            ->where('start_sell_date', '<=', $now)
            ->where('end_sell_date', '>=', $now)
            ->where('is_online_sellable', true)
            ->get()
            ->map(fn ($e) => StoreItemData::fromEvent($e)->toArray());

        $products = Product::with('variants')
            ->where('is_online_sellable', true)
            ->get()
            ->map(fn ($p) => StoreItemData::fromProduct($p)->toArray());

        return Inertia::render('cart', [
            'sellables' => $events->concat($products)->values(),
            'processingFeeRate' => config('services.sumup.processing_fee_rate', 0.02),
        ]);
    }
}
