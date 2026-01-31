<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventImage;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Services\InventoryManagementService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellablesController extends Controller
{
    protected InventoryManagementService $inventoryService;

    public function __construct(\App\Services\InventoryManagementService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    public function index(\Illuminate\Http\Request $request)
    {
        $products = Product::with('variants')->withCount(['sales', 'onlineSales'])->orderBy('name')->get();
        $now = now();
        // Fetch all live/upcoming events (event_date >= now)
        $liveEvents = Event::with(['responsibleUser', 'variants'])->withCount([
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
        ])
            ->where('event_date', '>=', $now)
            ->orderBy('event_date', 'asc')
            ->get()
            ->map(fn ($event) => $this->formatEvent($event));

        // Paginate expired events (event_date < now). Return first page in index.
        $expiredPage = max(1, (int) $request->query('expired_page', 1));
        $expiredPerPage = max(1, (int) $request->query('expired_per_page', 10));

        $expiredQuery = Event::with('responsibleUser')->withCount([
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
        ])
            ->where('event_date', '<', $now)
            ->orderBy('event_date', 'desc');

        $expiredPaginator = $expiredQuery->paginate($expiredPerPage, ['*'], 'expired_page', $expiredPage);

        $expiredEvents = collect($expiredPaginator->items())->map(fn ($event) => $this->formatEvent($event));

        // Combine live/upcoming (all) then the first page of expired events
        $events = $liveEvents->concat($expiredEvents)->values();
        $boardUsers = User::where('permissions', 'like', '%board%')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('Backstage/sellables', [
            'products' => $products,
            'events' => $events,
            'expired_pagination' => [
                'current_page' => $expiredPaginator->currentPage(),
                'last_page' => $expiredPaginator->lastPage(),
                'per_page' => $expiredPaginator->perPage(),
                'total' => $expiredPaginator->total(),
                'has_more' => $expiredPaginator->hasMorePages(),
            ],
            'boardUsers' => $boardUsers->map(fn ($u) => [
                'id' => $u->id,
                'name' => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
                'email' => $u->email,
            ]),
        ]);
    }

    /**
     * Serialize an Event model into the shape expected by the front-end.
     * (No OfficeShift JSON column logic for sales/workers; use relationships only.)
     */
    protected function formatEvent(Event $event)
    {
        // Only include variants if variants_config is not null/empty
        $hasVariants = ! empty($event->variants_config);

        return [
            'id' => $event->id,
            'is_variant_based' => $event->is_variant_based,
            'name' => $event->name,
            'description' => $event->description,
            'event_date' => $event->event_date,
            'start_sell_date' => $event->start_sell_date,
            'end_sell_date' => $event->end_sell_date,
            'price_with_card' => $event->price_with_card,
            'price_without_card' => $event->price_without_card,
            'quantity' => $event->quantity,
            'unlimited_quantity' => (bool) ($event->unlimited_quantity ?? false),
            'responsible_user_id' => $event->responsible_user_id,
            'notes' => $event->notes,
            'variable_amount' => $event->variable_amount,
            'quantity_with_card' => $event->quantity_with_card,
            'unlimited_quantity_with_card' => (bool) ($event->unlimited_quantity_with_card ?? false),
            'quantity_without_card' => $event->quantity_without_card,
            'unlimited_quantity_without_card' => (bool) ($event->unlimited_quantity_without_card ?? false),
            'google_spreadsheet_id' => $event->google_spreadsheet_id,
            'responsibleUser' => $event->responsibleUser ? [
                'id' => $event->responsibleUser->id,
                'first_name' => $event->responsibleUser->first_name,
                'last_name' => $event->responsibleUser->last_name,
            ] : null,
            'remaining' => $event->remaining,
            'remaining_with_card' => $event->remaining_with_card,
            'remaining_without_card' => $event->remaining_without_card,
            'is_online_sellable' => $event->is_online_sellable,
            'images_list' => $event->images_list,
            'instagram_link' => $event->instagram_link,
            'variants_config' => $hasVariants ? $event->variants_config : null,
            'variants' => $hasVariants ? $event->variants()->get()->map(fn ($v) => [
                'id' => $v->id, // ULID
                'options' => $v->options,
                'quantity' => $v->quantity,
                'sold_count' => $v->sold_count,
            ]) : [],
        ];
    }

    /**
     * JSON endpoint to fetch paginated expired events (server-side pagination).
     */
    public function expired(Request $request)
    {
        $now = now();
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, (int) $request->query('per_page', 10));

        $query = Event::with('responsibleUser')->withCount([
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
        ])
            ->where('event_date', '<', $now)
            ->orderBy('event_date', 'desc');

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(fn ($e) => $this->formatEvent($e));

        return response()->json([
            'data' => $items,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'variants_config' => ['nullable'], // Accept any type, we'll normalize it
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity' => ['sometimes', 'boolean'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'is_online_sellable' => ['sometimes', 'boolean'],
            'is_variant_based' => ['sometimes', 'boolean'],
            'instagram_link' => ['nullable', 'string', 'max:500'],
            // SECURITY FIX: Block SVG uploads to prevent Stored XSS attacks.
            // SVG files can contain malicious JavaScript that executes when viewed.
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
        ]);

        // Normalize variants_config: empty string or empty array -> null, otherwise must be array
        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (! is_array($validated['variants_config'])) {
                // If it's not empty and not an array, validation failed - this shouldn't happen
                return back()->withErrors(['variants_config' => 'Invalid variants configuration']);
            }
        }

        $normalized = $this->inventoryService->normalizeInput($validated);

        $product = Product::create($normalized);

        // Sync Variants Only if variant based and config exists
        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased && $request->has('variants_stock') && ! empty($normalized['variants_config'])) {
            $this->syncVariants($product, $request->input('variants_stock'));
        }

        // Handle Image Uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $content = file_get_contents($file->getRealPath());
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_data' => $content,
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        $product->load('variants');
        \App\Events\SellableUpdated::dispatch($product);

        return redirect()->route('sellables');
    }

    public function updateProduct(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'variants_config' => ['nullable'], // Accept any type, we'll normalize it
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity' => ['sometimes', 'boolean'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'is_online_sellable' => ['sometimes', 'boolean'],
            'is_variant_based' => ['sometimes', 'boolean'],
            'instagram_link' => ['nullable', 'string', 'max:500'],
            // SECURITY FIX: Block SVG uploads to prevent Stored XSS attacks.
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
        ]);

        // Normalize variants_config: empty string or empty array -> null, otherwise must be array
        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (! is_array($validated['variants_config'])) {
                // If it's not empty and not an array, validation failed - this shouldn't happen
                return back()->withErrors(['variants_config' => 'Invalid variants configuration']);
            }
        }

        $normalized = $this->inventoryService->normalizeInput($validated);

        // Soft Toggle: If is_variant_based is explicitly false, do NOT update variants_config (preserve it)
        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased === false && array_key_exists('variants_config', $normalized)) {
            unset($normalized['variants_config']);
        }

        $product->update($normalized);

        // Sync or Clear Variants
        // Logic Update: We only sync if is_variant_based is TRUE.
        // If is_variant_based is FALSE, we DO NOT DELETE data. We just ignore it, acting as "soft toggle".
        $isVariantBased = $request->input('is_variant_based', false);

        if ($isVariantBased) {
             if ($request->has('variants_stock') && ! empty($normalized['variants_config'])) {
                $this->syncVariants($product, $request->input('variants_stock'));
            } else {
                // If variant based but missing config/stock, then we assume user wants to wipe them? 
                // Creating a safety net here, only delete if explicitly intended or empty. 
                // But for now, if is_variant_based is true, we expect valid variants.
                $product->variants()->delete();
            }
        }

        // Handle Image Uploads (Append)
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $content = file_get_contents($file->getRealPath());
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_data' => $content,
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        // Handle Image Deletions
        if ($request->has('deleted_images')) {
            $deletedIds = $request->input('deleted_images');
            if (is_array($deletedIds)) {
                ProductImage::whereIn('id', $deletedIds)->where('product_id', $product->id)->delete();
            }
        }

        $product->load('variants');
        \App\Events\SellableUpdated::dispatch($product);
    }

    public function destroyProduct(Product $product)
    {
        $product->delete();

        return redirect()->route('sellables');
    }

    public function storeEvent(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'variants_config' => ['nullable'], // Accept any type, we'll normalize it
            'event_date' => ['required', 'date'],
            'start_sell_date' => ['required', 'date'],
            'end_sell_date' => ['required', 'date', 'after:start_sell_date'],
            'price_with_card' => ['required', 'numeric', 'min:0'],
            'price_without_card' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity' => ['sometimes', 'boolean'],
            'responsible_user_id' => ['required', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'google_spreadsheet_id' => ['nullable', 'string'],
            'is_online_sellable' => ['sometimes', 'boolean'],
            'instagram_link' => ['nullable', 'string', 'max:500'],
            // SECURITY FIX: Block SVG uploads to prevent Stored XSS attacks.
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
        ]);

        // Normalize variants_config: empty string or empty array -> null, otherwise must be array
        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (! is_array($validated['variants_config'])) {
                // If it's not empty and not an array, validation failed - this shouldn't happen
                return back()->withErrors(['variants_config' => 'Invalid variants configuration']);
            }
        }

        $normalized = $this->inventoryService->normalizeInput($validated);

        $event = Event::create($normalized);

        // Sync Variants (only if variants_config is not null/empty)
        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased && $request->has('variants_stock') && ! empty($normalized['variants_config'])) {
            $this->syncVariants($event, $request->input('variants_stock'));
        }

        // Handle Image Uploads
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $content = file_get_contents($file->getRealPath());
                EventImage::create([
                    'event_id' => $event->id,
                    'image_data' => $content,
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        $event->load('variants', 'responsibleUser');
        \App\Events\SellableUpdated::dispatch($event);

        return redirect()->route('sellables');
    }

    public function updateEvent(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'variants_config' => ['nullable'], // Accept any type, we'll normalize it
            'event_date' => ['required', 'date'],
            'start_sell_date' => ['required', 'date'],
            'end_sell_date' => ['required', 'date', 'after:start_sell_date'],
            'price_with_card' => ['required', 'numeric', 'min:0'],
            'price_without_card' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity' => ['sometimes', 'boolean'],
            'responsible_user_id' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'google_spreadsheet_id' => ['nullable', 'string'],
            'is_online_sellable' => ['sometimes', 'boolean'],
            'is_variant_based' => ['sometimes', 'boolean'],
            'instagram_link' => ['nullable', 'string', 'max:500'],
            // SECURITY FIX: Block SVG uploads to prevent Stored XSS attacks.
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
        ]);

        // Normalize variants_config: empty string or empty array -> null, otherwise must be array
        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (! is_array($validated['variants_config'])) {
                // If it's not empty and not an array, validation failed - this shouldn't happen
                return back()->withErrors(['variants_config' => 'Invalid variants configuration']);
            }
        }

        $normalized = $this->inventoryService->normalizeInput($validated);

        // If google_spreadsheet_id is not provided on update, do not overwrite existing value
        if (array_key_exists('google_spreadsheet_id', $validated) && $validated['google_spreadsheet_id'] === null) {
            // Remove the key so update won't clear the existing value accidentally
            // However, normalizeInput returns a new array, so we must check normalized or original validated
            // The service doesn't touch google_spreadsheet_id, so it should be safe to check $normalized
            if (array_key_exists('google_spreadsheet_id', $normalized) && $normalized['google_spreadsheet_id'] === null) {
                unset($normalized['google_spreadsheet_id']);
            }
        }

        // Soft Toggle: If is_variant_based is explicitly false, do NOT update variants_config (preserve it)
        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased === false && array_key_exists('variants_config', $normalized)) {
            unset($normalized['variants_config']);
        }

        $event->update($normalized);

        // Sync or Clear Variants
        $isVariantBased = $request->input('is_variant_based', false);

        if ($isVariantBased) {
            if ($request->has('variants_stock') && ! empty($normalized['variants_config'])) {
                $this->syncVariants($event, $request->input('variants_stock'));
            } else {
                $event->variants()->delete();
            }
        }

        // Handle Image Uploads (Append)
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $content = file_get_contents($file->getRealPath());
                EventImage::create([
                    'event_id' => $event->id,
                    'image_data' => $content,
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        // Handle Image Deletions
        if ($request->has('deleted_images')) {
            $deletedIds = $request->input('deleted_images');
            if (is_array($deletedIds)) {
                EventImage::whereIn('id', $deletedIds)->where('event_id', $event->id)->delete();
            }
        }

        $event->load('variants', 'responsibleUser');
        \App\Events\SellableUpdated::dispatch($event);
    }

    public function destroyImage(EventImage $image)
    {
        $image->delete();

        return back();
    }

    public function destroyProductImage(ProductImage $image)
    {
        $image->delete();

        return back();
    }

    public function destroyEvent(Event $event)
    {
        $event->delete();

        return redirect()->route('sellables');
    }

    protected function syncVariants($sellable, array $variantsInput)
    {
        // Get existing variants
        $existing = $sellable->variants()->get();
        $processedIds = [];

        foreach ($variantsInput as $variantData) {
            $options = $variantData['options'];
            $quantity = isset($variantData['quantity']) && $variantData['quantity'] !== '' ? (int) $variantData['quantity'] : null;

            // Find existing variant with same options to update
            // Note: Database check for options JSON equality can be tricky, doing in-memory match for simplicity
            // provided the number of variants is low.
            $match = $existing->first(function ($v) use ($options) {
                // sort keys/values to ensure comparison works
                $opt1 = $v->options;
                ksort($opt1);
                $opt2 = $options;
                ksort($opt2);

                return $opt1 == $opt2;
            });

            if ($match) {
                $match->update(['quantity' => $quantity]);
                $processedIds[] = $match->id;
            } else {
                $created = $sellable->variants()->create([
                    'options' => $options,
                    'quantity' => $quantity,
                ]);
                $processedIds[] = $created->id;
            }
        }

        // Delete variants that were not in the input (removed combinations)
        $sellable->variants()->whereNotIn('id', $processedIds)->delete();
    }
}
