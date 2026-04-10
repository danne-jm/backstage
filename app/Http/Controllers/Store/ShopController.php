<?php

namespace App\Http\Controllers\Store;

use App\DTOs\Store\StoreItemData;
use App\DTOs\Store\StoreSellableData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Store\CartSellablesRequest;
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
            $events = Event::with(['variants', 'media'])->where('start_sell_date', '<=', $now)
                ->where('end_sell_date', '>=', $now)
                ->where('is_online_sellable', true)
                ->orderBy('event_date', 'asc')
                ->get()
                ->map(fn($e) => StoreSellableData::fromEvent($e)->toArray());

            $products = Product::with(['variants', 'media'])->where('is_online_sellable', true)
                ->where(function ($q) use ($now) {
                    $q->whereNull('start_sell_date')->orWhere('start_sell_date', '<=', $now);
                })
                ->where(function ($q) use ($now) {
                    $q->whereNull('end_sell_date')->orWhere('end_sell_date', '>=', $now);
                })
                ->orderBy('name')
                ->get()
                ->map(fn($p) => StoreSellableData::fromProduct($p)->toArray());

            return ['sellables' => $events->concat($products)->values()];
        });

        return Inertia::render('home', $data);
    }

    public function show(string $type, string $id)
    {
        $cacheKey = "shop_item_{$type}_{$id}";

        $item = Cache::remember($cacheKey, 60, function () use ($type, $id) {
            if ($type === 'event') {
                $event = Event::with(['variants', 'media'])
                    ->where('id', $id)
                    ->where('is_online_sellable', true)
                    ->firstOrFail();

                return StoreItemData::fromEvent($event)->toArray();
            }

            if ($type === 'product') {
                $product = Product::with(['variants', 'media'])
                    ->where('id', $id)
                    ->where('is_online_sellable', true)
                    ->firstOrFail();

                return StoreItemData::fromProduct($product)->toArray();
            }

            return null;
        });

        if (!$item) {
            abort(404);
        }

        return Inertia::render('show', ['item' => $item]);
    }

    public function cart()
    {
        return Inertia::render('cart', [
            'sellables' => [],
            'processingFeeRate' => config('services.sumup.processing_fee_rate', 0.02),
        ]);
    }

    /**
     * Return only cart-referenced items to avoid loading full inventory on cart page.
     */
    public function cartSellables(CartSellablesRequest $request)
    {
        $validated = $request->validated();
        $now = now();

        $productIds = collect($validated['items'])
            ->where('type', 'product')
            ->pluck('id')
            ->unique()
            ->values();

        $eventIds = collect($validated['items'])
            ->where('type', 'event')
            ->pluck('id')
            ->unique()
            ->values();

        $products = Product::with(['variants', 'media'])
            ->whereIn('id', $productIds)
            ->where('is_online_sellable', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('start_sell_date')->orWhere('start_sell_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_sell_date')->orWhere('end_sell_date', '>=', $now);
            })
            ->get()
            ->map(fn($p) => StoreItemData::fromProduct($p)->toArray());

        $events = Event::with(['variants', 'media'])
            ->whereIn('id', $eventIds)
            ->where('is_online_sellable', true)
            ->where('start_sell_date', '<=', $now)
            ->where('end_sell_date', '>=', $now)
            ->get()
            ->map(fn($e) => StoreItemData::fromEvent($e)->toArray());

        return response()->json([
            'sellables' => $events->concat($products)->values(),
        ]);
    }
}
