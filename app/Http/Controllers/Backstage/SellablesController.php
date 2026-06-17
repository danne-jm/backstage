<?php

namespace App\Http\Controllers\Backstage;

use App\Actions\Catalog\SaveEventAction;
use App\Actions\Catalog\SaveProductAction;
use App\DTOs\Catalog\EventPayload;
use App\DTOs\Catalog\ProductPayload;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\SaveEventRequest;
use App\Http\Requests\Backstage\SaveProductRequest;
use App\Models\Event;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SellablesController extends Controller
{
    /**
     * Display a combined list of all events and products.
     */
    public function index(): Response
    {
        return Inertia::render('backstage/sellables/index', [
            'events' => Event::orderByDesc('event_date')->get()->map(fn (Event $event) => [
                'id' => $event->id,
                'name' => $event->name,
                'event_date' => $event->event_date?->toIso8601String(),
                'is_online_sellable' => $event->is_online_sellable,
                'remaining_stock' => $event->getRemainingStock(),
            ]),
            'products' => Product::orderBy('name')->get()->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'is_online_sellable' => $product->is_online_sellable,
                'remaining_stock' => $product->getRemainingStock(),
            ]),
        ]);
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    public function createEvent(): Response
    {
        return Inertia::render('backstage/sellables/events/create');
    }

    public function storeEvent(SaveEventRequest $request, SaveEventAction $action): RedirectResponse
    {
        $payload = new EventPayload(
            name: $request->string('name')->toString(),
            description: $request->string('description')->toString(),
            eventDate: $request->date('event_date'),
            startSellDate: $request->date('start_sell_date'),
            endSellDate: $request->date('end_sell_date'),
            isOnlineSellable: $request->boolean('is_online_sellable'),
            hideUntilSale: $request->boolean('hide_until_sale'),
            priceWithoutMembership: (float) $request->input('price_without_membership', 0),
            priceWithMembership: (float) $request->input('price_with_membership', 0),
            variableAmount: $request->boolean('variable_amount'),
            unlimitedQuantity: $request->boolean('unlimited_quantity', true),
            quantity: $request->integer('quantity') ?: null,
            unlimitedQuantityWithMembership: $request->boolean('unlimited_quantity_with_membership', true),
            quantityWithMembership: $request->integer('quantity_with_membership') ?: null,
            unlimitedQuantityWithoutMembership: $request->boolean('unlimited_quantity_without_membership', true),
            quantityWithoutMembership: $request->integer('quantity_without_membership') ?: null,
            isVariantBased: $request->boolean('is_variant_based'),
            variantsConfig: $request->input('variants_config'),
            googleSpreadsheetId: $request->input('google_spreadsheet_id'),
            googleSheetName: $request->input('google_sheet_name'),
            attendeeFilterConfig: $request->input('attendee_filter_config'),
            responsibleUserIds: $request->input('responsible_user_ids'),
        );

        $action->handle($payload);

        return to_route('backstage.sellables.index')
            ->with('success', 'Event created successfully.');
    }

    public function editEvent(Event $event): Response
    {
        return Inertia::render('backstage/sellables/events/edit', [
            'event' => $event,
        ]);
    }

    public function updateEvent(SaveEventRequest $request, Event $event, SaveEventAction $action): RedirectResponse
    {
        $payload = new EventPayload(
            name: $request->string('name')->toString(),
            description: $request->string('description')->toString(),
            eventDate: $request->date('event_date'),
            startSellDate: $request->date('start_sell_date'),
            endSellDate: $request->date('end_sell_date'),
            isOnlineSellable: $request->boolean('is_online_sellable'),
            hideUntilSale: $request->boolean('hide_until_sale'),
            priceWithoutMembership: (float) $request->input('price_without_membership', 0),
            priceWithMembership: (float) $request->input('price_with_membership', 0),
            variableAmount: $request->boolean('variable_amount'),
            unlimitedQuantity: $request->boolean('unlimited_quantity', true),
            quantity: $request->integer('quantity') ?: null,
            unlimitedQuantityWithMembership: $request->boolean('unlimited_quantity_with_membership', true),
            quantityWithMembership: $request->integer('quantity_with_membership') ?: null,
            unlimitedQuantityWithoutMembership: $request->boolean('unlimited_quantity_without_membership', true),
            quantityWithoutMembership: $request->integer('quantity_without_membership') ?: null,
            isVariantBased: $request->boolean('is_variant_based'),
            variantsConfig: $request->input('variants_config'),
            googleSpreadsheetId: $request->input('google_spreadsheet_id'),
            googleSheetName: $request->input('google_sheet_name'),
            attendeeFilterConfig: $request->input('attendee_filter_config'),
            responsibleUserIds: $request->input('responsible_user_ids'),
        );

        $action->handle($payload, $event);

        return to_route('backstage.sellables.index')
            ->with('success', 'Event updated successfully.');
    }

    public function destroyEvent(Event $event): RedirectResponse
    {
        $event->delete();

        return to_route('backstage.sellables.index')
            ->with('success', 'Event deleted successfully.');
    }

    // ─── Products ─────────────────────────────────────────────────────────────

    public function createProduct(): Response
    {
        return Inertia::render('backstage/sellables/products/create');
    }

    public function storeProduct(SaveProductRequest $request, SaveProductAction $action): RedirectResponse
    {
        $payload = new ProductPayload(
            name: $request->string('name')->toString(),
            description: $request->string('description')->toString(),
            startSellDate: $request->date('start_sell_date'),
            endSellDate: $request->date('end_sell_date'),
            isOnlineSellable: $request->boolean('is_online_sellable'),
            hideUntilSale: $request->boolean('hide_until_sale'),
            price: (float) $request->input('price', 0),
            priceWithoutMembership: (float) $request->input('price_without_membership', 0),
            priceWithMembership: (float) $request->input('price_with_membership', 0),
            variableAmount: $request->boolean('variable_amount'),
            unlimitedQuantity: $request->boolean('unlimited_quantity', true),
            quantity: $request->integer('quantity') ?: null,
            unlimitedQuantityWithMembership: $request->boolean('unlimited_quantity_with_membership', true),
            quantityWithMembership: $request->integer('quantity_with_membership') ?: null,
            unlimitedQuantityWithoutMembership: $request->boolean('unlimited_quantity_without_membership', true),
            quantityWithoutMembership: $request->integer('quantity_without_membership') ?: null,
            isVariantBased: $request->boolean('is_variant_based'),
            variantsConfig: $request->input('variants_config'),
            responsibleUserIds: $request->input('responsible_user_ids'),
        );

        $action->handle($payload);

        return to_route('backstage.sellables.index')
            ->with('success', 'Product created successfully.');
    }

    public function editProduct(Product $product): Response
    {
        return Inertia::render('backstage/sellables/products/edit', [
            'product' => $product,
        ]);
    }

    public function updateProduct(SaveProductRequest $request, Product $product, SaveProductAction $action): RedirectResponse
    {
        $payload = new ProductPayload(
            name: $request->string('name')->toString(),
            description: $request->string('description')->toString(),
            startSellDate: $request->date('start_sell_date'),
            endSellDate: $request->date('end_sell_date'),
            isOnlineSellable: $request->boolean('is_online_sellable'),
            hideUntilSale: $request->boolean('hide_until_sale'),
            price: (float) $request->input('price', 0),
            priceWithoutMembership: (float) $request->input('price_without_membership', 0),
            priceWithMembership: (float) $request->input('price_with_membership', 0),
            variableAmount: $request->boolean('variable_amount'),
            unlimitedQuantity: $request->boolean('unlimited_quantity', true),
            quantity: $request->integer('quantity') ?: null,
            unlimitedQuantityWithMembership: $request->boolean('unlimited_quantity_with_membership', true),
            quantityWithMembership: $request->integer('quantity_with_membership') ?: null,
            unlimitedQuantityWithoutMembership: $request->boolean('unlimited_quantity_without_membership', true),
            quantityWithoutMembership: $request->integer('quantity_without_membership') ?: null,
            isVariantBased: $request->boolean('is_variant_based'),
            variantsConfig: $request->input('variants_config'),
            responsibleUserIds: $request->input('responsible_user_ids'),
        );

        $action->handle($payload, $product);

        return to_route('backstage.sellables.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroyProduct(Product $product): RedirectResponse
    {
        $product->delete();

        return to_route('backstage.sellables.index')
            ->with('success', 'Product deleted successfully.');
    }
}
