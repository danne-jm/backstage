<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    /**
     * Public storefront index: list all online-sellable events and products.
     */
    public function index(): Response
    {
        $now = now();

        $events = Event::where('is_online_sellable', true)
            ->where(fn ($q) => $q->whereNull('end_sell_date')->orWhere('end_sell_date', '>=', $now))
            ->where(fn ($q) => $q->where('hide_until_sale', false)->orWhere('start_sell_date', '<=', $now))
            ->orderBy('event_date')
            ->get()
            ->map(function (Event $event): array {
                return [
                    'id' => $event->id,
                    'type' => 'event',
                    'name' => $event->name,
                    'description' => $event->description,
                    'event_date' => $event->event_date ? Carbon::parse($event->event_date)->toIso8601String() : null,
                    'price_without_membership' => $event->price_without_membership,
                    'price_with_membership' => $event->price_with_membership,
                    'variable_amount' => $event->variable_amount,
                    'is_available' => $event->isAvailable(),
                    'is_variant_based' => $event->is_variant_based,
                ];
            })->all();

        $products = Product::where('is_online_sellable', true)
            ->where(fn ($q) => $q->whereNull('end_sell_date')->orWhere('end_sell_date', '>=', $now))
            ->where(fn ($q) => $q->where('hide_until_sale', false)->orWhere('start_sell_date', '<=', $now))
            ->orderBy('name')
            ->get()
            ->map(function (Product $product): array {
                return [
                    'id' => $product->id,
                    'type' => 'product',
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'price_without_membership' => $product->price_without_membership,
                    'price_with_membership' => $product->price_with_membership,
                    'variable_amount' => $product->variable_amount,
                    'is_available' => $product->isAvailable(),
                    'is_variant_based' => $product->is_variant_based,
                ];
            })->all();

        return Inertia::render('store/index', [
            'events' => $events,
            'products' => $products,
        ]);
    }

    /**
     * Show a single sellable item detail page.
     * Type is either "event" or "product".
     */
    public function show(string $type, string $id): Response
    {
        $item = match ($type) {
            'event' => Event::findOrFail($id),
            'product' => Product::findOrFail($id),
            default => abort(404),
        };

        return Inertia::render('store/show', [
            'item' => [
                'id' => $item->id,
                'type' => $type,
                'name' => $item->getName(),
                'description' => $item->getDescription(),
                'price' => $item->getPrice(),
                'price_without_membership' => $item->price_without_membership ?? null,
                'price_with_membership' => $item->price_with_membership ?? null,
                'variable_amount' => $item->variable_amount,
                'is_available' => $item->isAvailable(),
                'is_variant_based' => $item->is_variant_based,
                'variants_config' => $item->variants_config,
                'event_date' => $item instanceof Event && $item->event_date ? Carbon::parse($item->event_date)->toIso8601String() : null,
                'start_sell_date' => $item->start_sell_date ? Carbon::parse($item->start_sell_date)->toIso8601String() : null,
                'end_sell_date' => $item->end_sell_date ? Carbon::parse($item->end_sell_date)->toIso8601String() : null,
                'stock' => [
                    'universal' => $item->hasUnlimitedQuantity() ? null : $item->getRemainingStock(),
                    'with_membership' => $item->variable_amount ? $item->getRemainingStock('with_membership') : null,
                    'without_membership' => $item->variable_amount ? $item->getRemainingStock('regular') : null,
                ],
            ],
        ]);
    }

    /**
     * Render the cart page (client-side state only).
     */
    public function cart(): Response
    {
        return Inertia::render('store/cart');
    }

    /**
     * Hydrate cart items from the server. Validates that each item still
     * exists and is purchasable, and returns fresh pricing + stock info.
     *
     * POST /cart/sellables
     * Body: [{ type: 'event'|'product', id: string, quantity: int }]
     */
    public function cartSellables(Request $request): JsonResponse
    {
        $request->validate([
            'items' => ['required', 'array'],
            'items.*.type' => ['required', 'string', 'in:event,product'],
            'items.*.id' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.ticket_type' => ['nullable', 'string', 'in:regular,with_membership'],
        ]);

        $hydratedItems = array_map(function (array $item) {
            /** @var Event|Product|null $model */
            $model = match ($item['type']) {
                'event' => Event::where('id', (string) $item['id'])->first(),
                'product' => Product::where('id', (string) $item['id'])->first(),
                default => null,
            };

            if (! $model) {
                return ['id' => $item['id'], 'type' => $item['type'], 'error' => 'Item no longer exists.'];
            }

            $ticketType = $item['ticket_type'] ?? 'regular';
            $unitPrice = $ticketType === 'with_membership'
                ? ($model->price_with_membership ?? $model->getPrice())
                : ($model->price_without_membership ?? $model->getPrice());

            return [
                'id' => $model->id,
                'type' => $item['type'],
                'name' => $model->getName(),
                'unit_price' => $unitPrice,
                'quantity' => $item['quantity'],
                'subtotal' => $unitPrice * $item['quantity'],
                'ticket_type' => $ticketType,
                'is_available' => $model->isAvailable($ticketType),
                'remaining_stock' => $model->getRemainingStock($ticketType),
            ];
        }, (array) $request->input('items'));

        return response()->json(['items' => $hydratedItems]);
    }
}
