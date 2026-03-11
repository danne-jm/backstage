<?php

namespace App\Http\Controllers;

use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Models\User;
use App\Services\SellablesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SellablesController extends Controller
{
    protected SellablesService $inventoryService;

    public function __construct(SellablesService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
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
        $products = Product::with('variants')->withCount(['sales', 'onlineSales'])->orderBy('name')->get();
        $now = now();

        $liveEvents = $this->baseEventQuery()
            ->where('end_sell_date', '>=', $now)
            ->orderBy('event_date', 'asc')
            ->get()
            ->map(fn($event) => $this->formatEvent($event));

        $expiredPage = max(1, (int) $request->query('expired_page', 1));
        $expiredPerPage = max(1, (int) $request->query('expired_per_page', 10));

        $expiredPaginator = $this->baseEventQuery()
            ->where('end_sell_date', '<', $now)
            ->orderBy('event_date', 'desc')
            ->paginate($expiredPerPage, ['*'], 'expired_page', $expiredPage);

        $expiredEvents = collect($expiredPaginator->items())->map(fn($event) => $this->formatEvent($event));

        $events = $liveEvents->concat($expiredEvents)->values();
        $boardUsers = User::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('sellables', [
            'products' => $products,
            'events' => $events,
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

    protected function formatEvent(Event $event)
    {
        $hasVariants = !empty($event->variants_config);

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
            'image' => $event->image,
            'images_list' => $event->images_list,
            'instagram_link' => $event->instagram_link,
            'variants_config' => $hasVariants ? $event->variants_config : null,
            'variants' => $hasVariants ? $event->variants()->get()->map(fn($v) => [
                'id' => $v->id, // ULID
                'options' => $v->options,
                'quantity' => $v->quantity,
                'sold_count' => $v->sold_count,
            ]) : [],
        ];
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

        $items = collect($paginator->items())->map(fn($e) => $this->formatEvent($e));

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

    protected function validateAndNormalizeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'variants_config' => ['nullable'],
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'unlimited_quantity' => ['sometimes', 'boolean'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'is_online_sellable' => ['sometimes', 'boolean'],
            'is_variant_based' => ['sometimes', 'boolean'],
            'instagram_link' => ['nullable', 'string', 'max:500'],
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
        ]);

        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (!is_array($validated['variants_config'])) {
                abort(422, 'Invalid variants configuration');
            }
        }

        return $this->inventoryService->normalizeInput($validated);
    }
    
    protected function validateAndNormalizeEvent(Request $request)
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
            'images.*' => ['nullable', 'image', 'mimetypes:image/jpeg,image/png,image/gif,image/webp', 'max:10240'],
        ]);

        if (array_key_exists('variants_config', $validated)) {
            if (empty($validated['variants_config']) || $validated['variants_config'] === '') {
                $validated['variants_config'] = null;
            } elseif (!is_array($validated['variants_config'])) {
                abort(422, 'Invalid variants configuration');
            }
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
            $this->syncVariants($product, $request->input('variants_stock'));
        }

        $this->handleImages($request, $product);

        $product->load('variants');
        \App\Events\SellableUpdated::dispatch($product);

        return redirect()->route('sellables');
    }

    public function updateProduct(Request $request, Product $product)
    {
        $normalized = $this->validateAndNormalizeProduct($request);

        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased === false && array_key_exists('variants_config', $normalized)) {
            unset($normalized['variants_config']);
        }

        $product->update($normalized);

        if ($isVariantBased) {
            if ($request->has('variants_stock') && !empty($normalized['variants_config'])) {
                $this->syncVariants($product, $request->input('variants_stock'));
            } else {
                $product->variants()->delete();
            }
        } else {
            $product->variants()->delete();
        }

        $this->handleImages($request, $product);

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
        $normalized = $this->validateAndNormalizeEvent($request);
        $event = Event::create($normalized);

        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased && $request->has('variants_stock') && !empty($normalized['variants_config'])) {
            $this->syncVariants($event, $request->input('variants_stock'));
        }

        $this->handleImages($request, $event);

        $event->load('variants', 'responsibleUser');
        \App\Events\SellableUpdated::dispatch($event);

        return redirect()->route('sellables');
    }

    public function updateEvent(Request $request, Event $event)
    {
        $normalized = $this->validateAndNormalizeEvent($request);

        $isVariantBased = $request->input('is_variant_based', false);
        if ($isVariantBased === false && array_key_exists('variants_config', $normalized)) {
            unset($normalized['variants_config']);
        }

        $event->update($normalized);

        if ($isVariantBased) {
            if ($request->has('variants_stock') && !empty($normalized['variants_config'])) {
                $this->syncVariants($event, $request->input('variants_stock'));
            } else {
                $event->variants()->delete();
            }
        } else {
             $event->variants()->delete();
        }

        $this->handleImages($request, $event);

        $event->load('variants', 'responsibleUser');
        \App\Events\SellableUpdated::dispatch($event);
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
        return redirect()->route('sellables');
    }

    protected function syncVariants($sellable, array $variantsInput)
    {
        $existing = $sellable->variants()->get();
        $processedIds = [];

        foreach ($variantsInput as $variantData) {
            $options = $variantData['options'];
            $quantity = isset($variantData['quantity']) && $variantData['quantity'] !== '' ? (int) $variantData['quantity'] : null;

            $match = $existing->first(function ($v) use ($options) {
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

        $sellable->variants()->whereNotIn('id', $processedIds)->delete();
    }
}
