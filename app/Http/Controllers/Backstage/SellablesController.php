<?php

namespace App\Http\Controllers\Backstage;

use App\Actions\Catalog\SaveEventAction;
use App\Actions\Catalog\SaveProductAction;
use App\Actions\UploadImageAction;
use App\DTOs\Catalog\EventPayload;
use App\DTOs\Catalog\ProductPayload;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\SaveEventRequest;
use App\Http\Requests\Backstage\SaveProductRequest;
use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SellablesController extends Controller
{
    /**
     * @return array<int, array{id: string, name: string}>
     */
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
            'events' => Event::orderByDesc('event_date')->get()->map(function (Event $event) use ($users): array {
                return [
                    'id' => $event->id,
                    'name' => $event->name,
                    'description' => $event->description,
                    'event_date' => $event->event_date ? Carbon::parse($event->event_date)->toIso8601String() : null,
                    'start_sell_date' => $event->start_sell_date ? Carbon::parse($event->start_sell_date)->toIso8601String() : null,
                    'end_sell_date' => $event->end_sell_date ? Carbon::parse($event->end_sell_date)->toIso8601String() : null,
                    'is_online_sellable' => $event->is_online_sellable,

                    'remaining_stock' => $event->getRemainingStock(),
                    'sold_count' => $event->getSoldCount(),
                    'is_split_pool' => $event->isSplitPool(),
                    'remaining_stock_with_membership' => $event->isSplitPool() ? $event->getRemainingStock('with_membership') : null,
                    'sold_count_with_membership' => $event->isSplitPool() ? $event->getSoldCount('with_membership') : 0,
                    'remaining_stock_without_membership' => $event->isSplitPool() ? $event->getRemainingStock('regular') : null,
                    'sold_count_without_membership' => $event->isSplitPool() ? $event->getSoldCount('regular') : 0,

                    'price_with_membership' => $event->price_with_membership,
                    'price_without_membership' => $event->price_without_membership,
                    'is_variant_based' => $event->is_variant_based,
                    'variants_config' => $event->variants_config,
                    'responsible_users' => collect((array) $event->responsible_user_ids)->map(fn ($id) => $users[$id] ?? null)->filter()->implode(', '),
                    'image_path' => $event->image_path ? Storage::url($event->image_path) : null,
                ];
            })->all(),
            'products' => Product::orderBy('name')->get()->map(function (Product $product) use ($users): array {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'start_sell_date' => $product->start_sell_date ? Carbon::parse($product->start_sell_date)->toIso8601String() : null,
                    'end_sell_date' => $product->end_sell_date ? Carbon::parse($product->end_sell_date)->toIso8601String() : null,
                    'price' => $product->price,
                    'price_with_membership' => $product->price_with_membership,
                    'price_without_membership' => $product->price_without_membership,
                    'is_online_sellable' => $product->is_online_sellable,

                    'remaining_stock' => $product->getRemainingStock(),
                    'sold_count' => $product->getSoldCount(),
                    'is_split_pool' => $product->isSplitPool(),
                    'remaining_stock_with_membership' => $product->isSplitPool() ? $product->getRemainingStock('with_membership') : null,
                    'sold_count_with_membership' => $product->isSplitPool() ? $product->getSoldCount('with_membership') : 0,
                    'remaining_stock_without_membership' => $product->isSplitPool() ? $product->getRemainingStock('regular') : null,
                    'sold_count_without_membership' => $product->isSplitPool() ? $product->getSoldCount('regular') : 0,

                    'is_variant_based' => $product->is_variant_based,
                    'variants_config' => $product->variants_config,
                    'responsible_users' => collect((array) $product->responsible_user_ids)->map(fn ($id) => $users[$id] ?? null)->filter()->implode(', '),
                    'image_path' => $product->image_path ? Storage::url($product->image_path) : null,
                ];
            })->all(),
            'membershipCardName' => config('app.membership_card_name', 'ESNcard'),
        ]);
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    public function createEvent(): Response
    {
        return Inertia::render('backstage/sellables/events/create', [
            'users' => $this->getResponsibleUsers(),
        ]);
    }

    public function storeEvent(SaveEventRequest $request, SaveEventAction $action, UploadImageAction $uploadImageAction): RedirectResponse
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

        $event = $action->handle($payload);

        if ($request->hasFile('image')) {
            $event->update([
                'image_path' => $uploadImageAction->handle($request->file('image'), 'events'),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Event created successfully.']);

        return to_route('backstage.sellables.index');
    }

    public function editEvent(Event $event): Response
    {
        $eventData = $event->toArray();
        if ($event->image_path) {
            $eventData['image_path'] = Storage::url($event->image_path);
        }

        return Inertia::render('backstage/sellables/events/edit', [
            'event' => $eventData,
            'users' => $this->getResponsibleUsers(),
        ]);
    }

    public function updateEvent(SaveEventRequest $request, Event $event, SaveEventAction $action, UploadImageAction $uploadImageAction): RedirectResponse
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

        $event = $action->handle($payload, $event);

        if ($request->boolean('remove_image')) {
            if ($event->image_path && Storage::exists($event->image_path)) {
                Storage::delete($event->image_path);
            }
            $event->update(['image_path' => null]);
        } elseif ($request->hasFile('image')) {
            $event->update([
                'image_path' => $uploadImageAction->handle($request->file('image'), 'events', $event->image_path),
            ]);
        }

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

    public function storeProduct(SaveProductRequest $request, SaveProductAction $action, UploadImageAction $uploadImageAction): RedirectResponse
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

        $product = $action->handle($payload);

        if ($request->hasFile('image')) {
            $product->update([
                'image_path' => $uploadImageAction->handle($request->file('image'), 'products'),
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product created successfully.']);

        return to_route('backstage.sellables.index');
    }

    public function editProduct(Product $product): Response
    {
        $productData = $product->toArray();
        if ($product->image_path) {
            $productData['image_path'] = Storage::url($product->image_path);
        }

        return Inertia::render('backstage/sellables/products/edit', [
            'product' => $productData,
            'users' => $this->getResponsibleUsers(),
        ]);
    }

    public function updateProduct(SaveProductRequest $request, Product $product, SaveProductAction $action, UploadImageAction $uploadImageAction): RedirectResponse
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

        $product = $action->handle($payload, $product);

        if ($request->boolean('remove_image')) {
            if ($product->image_path && Storage::exists($product->image_path)) {
                Storage::delete($product->image_path);
            }
            $product->update(['image_path' => null]);
        } elseif ($request->hasFile('image')) {
            $product->update([
                'image_path' => $uploadImageAction->handle($request->file('image'), 'products', $product->image_path),
            ]);
        }

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
