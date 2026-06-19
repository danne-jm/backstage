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
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SellablesController extends Controller
{
    private function getResponsibleUsers(): array
    {
        return User::select('id', 'first_name', 'last_name')
            ->get()
            ->map(fn ($u) => ['id' => $u->id, 'name' => trim($u->first_name.' '.$u->last_name)])
            ->values()
            ->toArray();
    }

    /**
     * Display a combined list of all events and products.
     */
    public function index(): Response
    {
        $users = User::select('id', 'first_name', 'last_name')
            ->get()
            ->mapWithKeys(fn ($user) => [$user->id => trim($user->first_name.' '.$user->last_name)]);

        return Inertia::render('backstage/sellables/index', [
            'events' => Event::orderByDesc('event_date')->get()->map(fn (Event $event) => [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'event_date' => $event->event_date?->toIso8601String(),
                'start_sell_date' => $event->start_sell_date?->toIso8601String(),
                'end_sell_date' => $event->end_sell_date?->toIso8601String(),
                'is_online_sellable' => $event->is_online_sellable,

                'remaining_stock' => $event->getRemainingStock(),
                'sold_count' => $event->getSoldCount(),
                'remaining_stock_with_membership' => $event->getRemainingStock('with_membership'),
                'sold_count_with_membership' => $event->getSoldCount('with_membership'),
                'remaining_stock_without_membership' => $event->getRemainingStock('regular'),
                'sold_count_without_membership' => $event->getSoldCount('regular'),

                'price_with_membership' => $event->price_with_membership,
                'price_without_membership' => $event->price_without_membership,
                'is_variant_based' => $event->is_variant_based,
                'variants_config' => $event->variants_config,
                'responsible_users' => collect($event->responsible_user_ids)->map(fn ($id) => $users[$id] ?? null)->filter()->implode(', '),
                'image_path' => $event->image_path ? Storage::url($event->image_path) : null,
            ]),
            'products' => Product::orderBy('name')->get()->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'start_sell_date' => $product->start_sell_date?->toIso8601String(),
                'end_sell_date' => $product->end_sell_date?->toIso8601String(),
                'price' => $product->price,
                'price_with_membership' => $product->price_with_membership,
                'price_without_membership' => $product->price_without_membership,
                'is_online_sellable' => $product->is_online_sellable,

                'remaining_stock' => $product->getRemainingStock(),
                'sold_count' => $product->getSoldCount(),
                'remaining_stock_with_membership' => $product->getRemainingStock('with_membership'),
                'sold_count_with_membership' => $product->getSoldCount('with_membership'),
                'remaining_stock_without_membership' => $product->getRemainingStock('regular'),
                'sold_count_without_membership' => $product->getSoldCount('regular'),

                'is_variant_based' => $product->is_variant_based,
                'variants_config' => $product->variants_config,
                'responsible_users' => collect($product->responsible_user_ids)->map(fn ($id) => $users[$id] ?? null)->filter()->implode(', '),
                'image_path' => $product->image_path ? Storage::url($product->image_path) : null,
            ]),
            'membershipCardName' => env('MEMBERSHIP_CARD_NAME', 'ESNcard'),
        ]);
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    public function createEvent(): Response
    {
        return Inertia::render('backstage/sellables/events/create', [
            'users' => $this->getResponsibleUsers(),
        ]);
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event created successfully.']);
        return to_route('backstage.sellables.index');
    }

    public function editEvent(Event $event): Response
    {
        return Inertia::render('backstage/sellables/events/edit', [
            'event' => $event,
            'users' => $this->getResponsibleUsers(),
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event updated successfully.']);
        return to_route('backstage.sellables.index');
    }

    public function destroyEvent(Event $event): RedirectResponse
    {
        $event->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event deleted successfully.']);
        return to_route('backstage.sellables.index');
    }

    // ─── Products ─────────────────────────────────────────────────────────────

    public function createProduct(): Response
    {
        return Inertia::render('backstage/sellables/products/create', [
            'users' => $this->getResponsibleUsers(),
        ]);
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product created successfully.']);
        return to_route('backstage.sellables.index');
    }

    public function editProduct(Product $product): Response
    {
        return Inertia::render('backstage/sellables/products/edit', [
            'product' => $product,
            'users' => $this->getResponsibleUsers(),
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

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product updated successfully.']);
        return to_route('backstage.sellables.index');
    }

    public function destroyProduct(Product $product): RedirectResponse
    {
        $product->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product deleted successfully.']);
        return to_route('backstage.sellables.index');
    }
}
