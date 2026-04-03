<?php

namespace App\Http\Controllers\Backstage;
use App\Http\Controllers\Controller;

use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Models\User;
use App\Services\SellablesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use App\Http\Resources\ProductResource;
use App\Http\Resources\EventResource;

class SellablesController extends Controller
{
    protected SellablesService $inventoryService;

    /**
     * Keep Inertia/XHR callers on their current page (e.g. /store-manager) instead of
     * always redirecting to /sellables. Fallback to the existing redirect for
     * non-Inertia requests.
     */
    protected function respondAfterMutation(Request $request)
    {
        return $request->header('X-Inertia') ? back() : redirect()->route('sellables');
    }

    public function __construct(SellablesService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Sanitize rich text content coming from staff/admin forms before persisting.
     * Keeps a safe subset of tags and strips executable/event-handler payloads.
     */
    protected function sanitizeRichText(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $clean = preg_replace('#<(script|style)[^>]*>.*?</\\1>#is', '', $html) ?? '';

        $clean = strip_tags(
            $clean,
            '<p><br><strong><em><b><i><u><ul><ol><li><a><h1><h2><h3><h4><blockquote><span>'
        );

        // Remove inline event handlers like onclick/onerror/etc.
        $clean = preg_replace('/\s(on\w+)\s*=\s*(".*?"|\'.*?\'|[^\s>]+)/i', '', $clean) ?? '';

        // Neutralize javascript: URLs if present in href/src attributes.
        $clean = preg_replace('/(href|src)\s*=\s*([\"\'])\s*javascript:[^\"\']*\2/i', '$1="#"', $clean) ?? '';

        return trim($clean);
    }

    protected function baseEventQuery()
    {
        return Event::with(['responsibleUser', 'variants'])->withCount([
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
        ]);
    }

    public function index(Request $request)
    {
        $products = Product::with('variants')
            ->withCount(['sales', 'onlineSales'])
            ->orderBy('name')
            ->get();

        $now = now();

        $liveEvents = $this->baseEventQuery()
            ->where('end_sell_date', '>=', $now)
            ->orderBy('event_date', 'asc')
            ->get();

        $expiredPage = max(1, (int) $request->query('expired_page', 1));
        $expiredPerPage = max(1, (int) $request->query('expired_per_page', 10));

        $expiredPaginator = $this->baseEventQuery()
            ->where('end_sell_date', '<', $now)
            ->orderBy('event_date', 'desc')
            ->paginate($expiredPerPage, ['*'], 'expired_page', $expiredPage);

        $boardUsers = User::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('sellables', [
            'products' => ProductResource::collection($products)->resolve(),
            'events' => EventResource::collection($liveEvents->concat($expiredPaginator->items()))->resolve(),
            'expired_pagination' => [
                'current_page' => $expiredPaginator->currentPage(),
                'last_page' => $expiredPaginator->lastPage(),
                'per_page' => $expiredPaginator->perPage(),
                'total' => $expiredPaginator->total(),
                'has_more' => $expiredPaginator->hasMorePages(),
            ],
            'boardUsers' => $boardUsers->map(fn($u) => [
                'id' => $u->id,
                'name' => trim(($u->first_name ?? '') . ' ' . ($u->last_name ?? '')),
                'email' => $u->email,
            ]),
        ]);
    }

    public function expired(Request $request)
    {
        $now = now();
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, (int) $request->query('per_page', 10));

        $paginator = $this->baseEventQuery()
            ->where('end_sell_date', '<', $now)
            ->orderBy('event_date', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => EventResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    protected function handleImages(Request $request, $sellable)
    {
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $sellable->addMedia($file)->toMediaCollection('images');
            }
        }

        if ($request->has('deleted_images')) {
            $deletedIds = $request->input('deleted_images');
            if (is_array($deletedIds)) {
                Media::whereIn('id', $deletedIds)->get()->each->delete();
            }
        }
    }

    protected function validateAndNormalizeProduct(Request $request, ?Product $product = null)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'variants_config' => ['nullable'],
            'price' => ['required', 'numeric', 'min:0'],
            'price_with_card' => ['nullable', 'numeric', 'min:0'],
            'price_without_card' => ['nullable', 'numeric', 'min:0'],
            'start_sell_date' => ['nullable', 'date'],
            'end_sell_date' => ['nullable', 'date'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'remaining_quantity' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity' => ['sometimes', 'boolean'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'remaining_quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'remaining_quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'is_online_sellable' => ['sometimes', 'boolean'],
            'is_variant_based' => ['sometimes', 'boolean'],
            'instagram_link' => ['nullable', 'string', 'max:500'],
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
            'variants_stock' => ['nullable', 'array'],
            'variants_stock.*.remaining_quantity' => ['nullable', 'integer', 'min:0'],
        ]);

        // Convert remaining quantities to total quantities if present
        if ($product) {
            // Main quantity
            if (isset($validated['remaining_quantity']) && $validated['remaining_quantity'] !== null) {
                // For Product, we use sold_count column or sales relation. Column is safer if maintained.
                // Assuming column is maintained. If not, use relation count.
                // Migration showed sold_count column.
                $sold = $product->sold_count; 
                $validated['quantity'] = $validated['remaining_quantity'] + $sold;
                unset($validated['remaining_quantity']);
            }
            
            // Variable amount quantities
            if (isset($validated['remaining_quantity_with_card']) && $validated['remaining_quantity_with_card'] !== null) {
                // Product doesn't have sold_count_with_card column in migration?
                // Migration only showed sold_count.
                // So for products variable pricing, we might need relation count filtered by type.
                // Or maybe Product doesn't support variable pricing properly in backend model?
                // Product table DOES have quantity_with_card, quantity_without_card columns.
                // BUT NO sold_count_with_card.
                // So we must count via relations.
                $soldWithCard = $product->sales()->where('snapshot->ticket_type', 'with_card')->count() 
                              + $product->onlineSales()->where('details->ticket_type', 'with_card')->count();
                $validated['quantity_with_card'] = $validated['remaining_quantity_with_card'] + $soldWithCard;
                 unset($validated['remaining_quantity_with_card']);
            }

            if (isset($validated['remaining_quantity_without_card']) && $validated['remaining_quantity_without_card'] !== null) {
                $soldWithoutCard = $product->sales()->where('snapshot->ticket_type', 'without_card')->count() 
                                 + $product->onlineSales()->where('details->ticket_type', 'without_card')->count();
                 $validated['quantity_without_card'] = $validated['remaining_quantity_without_card'] + $soldWithoutCard;
                 unset($validated['remaining_quantity_without_card']);
            }
        } elseif (isset($validated['remaining_quantity']) || isset($validated['remaining_quantity_with_card']) || isset($validated['remaining_quantity_without_card'])) {
            // Creation mode: Remaining = Total (Sold = 0)
             if (isset($validated['remaining_quantity'])) {
                 $validated['quantity'] = $validated['remaining_quantity'];
                 unset($validated['remaining_quantity']);
             }
             if (isset($validated['remaining_quantity_with_card'])) {
                 $validated['quantity_with_card'] = $validated['remaining_quantity_with_card'];
                 unset($validated['remaining_quantity_with_card']);
             }
            if (isset($validated['remaining_quantity_without_card'])) {
                 $validated['quantity_without_card'] = $validated['remaining_quantity_without_card'];
                 unset($validated['remaining_quantity_without_card']);
             }
        }
        
        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (!is_array($validated['variants_config'])) {
                abort(422, 'Invalid variants configuration');
            }
        }

        if (array_key_exists('description', $validated)) {
            $validated['description'] = $this->sanitizeRichText($validated['description']);
        }

        return $this->inventoryService->normalizeInput($validated);
    }

    protected function validateAndNormalizeEvent(Request $request, ?Event $event = null)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'variants_config' => ['nullable'],
            'event_date' => ['nullable', 'date'],
            'start_sell_date' => ['required', 'date'],
            'end_sell_date' => ['required', 'date', 'after:start_sell_date'],
            'price_with_card' => ['required', 'numeric', 'min:0'],
            'price_without_card' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'remaining_quantity' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity' => ['sometimes', 'boolean'],
            'responsible_user_id' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'remaining_quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'remaining_quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'google_spreadsheet_id' => ['nullable', 'string'],
            'is_online_sellable' => ['sometimes', 'boolean'],
            'is_variant_based' => ['sometimes', 'boolean'],
            'instagram_link' => ['nullable', 'string', 'max:500'],
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
            'variants_stock' => ['nullable', 'array'],
            'variants_stock.*.remaining_quantity' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($event) {
            // Main quantity (Simple)
            if (isset($validated['remaining_quantity']) && $validated['remaining_quantity'] !== null) {
                // Event simple sales calculation
                $sold = $event->sales()->count() + $event->onlineSales()->count(); 
                $validated['quantity'] = $validated['remaining_quantity'] + $sold;
                unset($validated['remaining_quantity']);
            }
            
            // Variable quantities
            if (isset($validated['remaining_quantity_with_card']) && $validated['remaining_quantity_with_card'] !== null) {
                $soldWithCard = $event->sold_count_with_card;
                $validated['quantity_with_card'] = $validated['remaining_quantity_with_card'] + $soldWithCard;
                unset($validated['remaining_quantity_with_card']);
            }

            if (isset($validated['remaining_quantity_without_card']) && $validated['remaining_quantity_without_card'] !== null) {
                $soldWithoutCard = $event->sold_count_without_card;
                $validated['quantity_without_card'] = $validated['remaining_quantity_without_card'] + $soldWithoutCard;
                unset($validated['remaining_quantity_without_card']);
            }
        } elseif (isset($validated['remaining_quantity']) || isset($validated['remaining_quantity_with_card']) || isset($validated['remaining_quantity_without_card'])) {
            // New Event: Remaining = Total
             if (isset($validated['remaining_quantity'])) {
                 $validated['quantity'] = $validated['remaining_quantity'];
                 unset($validated['remaining_quantity']);
             }
             if (isset($validated['remaining_quantity_with_card'])) {
                 $validated['quantity_with_card'] = $validated['remaining_quantity_with_card'];
                 unset($validated['remaining_quantity_with_card']);
             }
             if (isset($validated['remaining_quantity_without_card'])) {
                 $validated['quantity_without_card'] = $validated['remaining_quantity_without_card'];
                 unset($validated['remaining_quantity_without_card']);
             }
        }

        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (!is_array($validated['variants_config'])) {
                abort(422, 'Invalid variants configuration');
            }
        }

        if (array_key_exists('description', $validated)) {
            $validated['description'] = $this->sanitizeRichText($validated['description']);
        }

        $normalized = $this->inventoryService->normalizeInput($validated);

        if (array_key_exists('google_spreadsheet_id', $validated) && $validated['google_spreadsheet_id'] === null) {
            unset($normalized['google_spreadsheet_id']);
            $normalized['google_spreadsheet_id'] = null; // explicit
        }

        return $normalized;
    }

    public function storeProduct(Request $request)
    {
        $normalized = $this->validateAndNormalizeProduct($request);
        $product = Product::create($normalized);

        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased && $request->has('variants_stock') && !empty($normalized['variants_config'])) {
            $this->inventoryService->syncVariants($product, $request->input('variants_stock'));
        }

        $this->handleImages($request, $product);

        $product->load('variants');
        \App\Events\SellableUpdated::dispatch($product);

        return $this->respondAfterMutation($request);
    }

    public function updateProduct(Request $request, Product $product)
    {
        $normalized = $this->validateAndNormalizeProduct($request, $product);

        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased === false && array_key_exists('variants_config', $normalized)) {
            unset($normalized['variants_config']);
        }

        $product->update($normalized);

        if ($isVariantBased) {
            if ($request->has('variants_stock') && !empty($normalized['variants_config'])) {
                $this->inventoryService->syncVariants($product, $request->input('variants_stock'));
            } else {
                $product->variants()->delete();
            }
        } else {
            $product->variants()->delete();
        }

        $this->handleImages($request, $product);

        $product->load('variants');
        \App\Events\SellableUpdated::dispatch($product);

        return $this->respondAfterMutation($request);
    }

    public function destroyProduct(Product $product)
    {
        $product->delete();

        return $this->respondAfterMutation(request());
    }

    public function storeEvent(Request $request)
    {
        $normalized = $this->validateAndNormalizeEvent($request);
        $event = Event::create($normalized);

        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased && $request->has('variants_stock') && !empty($normalized['variants_config'])) {
            $this->inventoryService->syncVariants($event, $request->input('variants_stock'));
        }

        $this->handleImages($request, $event);

        $event->load('variants', 'responsibleUser');
        \App\Events\SellableUpdated::dispatch($event);

        return $this->respondAfterMutation($request);
    }

    public function updateEvent(Request $request, Event $event)
    {
        $normalized = $this->validateAndNormalizeEvent($request, $event);

        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased === false && array_key_exists('variants_config', $normalized)) {
            unset($normalized['variants_config']);
        }

        $event->update($normalized);

        if ($isVariantBased) {
            if ($request->has('variants_stock') && !empty($normalized['variants_config'])) {
                $this->inventoryService->syncVariants($event, $request->input('variants_stock'));
            } else {
                $event->variants()->delete();
            }
        } else {
            $event->variants()->delete();
        }

        $this->handleImages($request, $event);

        $event->load('variants', 'responsibleUser');
        \App\Events\SellableUpdated::dispatch($event);

        return $this->respondAfterMutation($request);
    }

    public function destroyImage(Media $image)
    {
        $image->delete();
        return back();
    }

    public function destroyProductImage(Media $image)
    {
        $image->delete();
        return back();
    }

    public function destroyEvent(Event $event)
    {
        $event->delete();
        return $this->respondAfterMutation(request());
    }
}

