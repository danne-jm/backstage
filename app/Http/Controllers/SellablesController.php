<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellablesController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        $products = Product::orderBy('name')->get();
        $now = now();
        // Fetch all live/upcoming events (event_date >= now)
        $liveEvents = Event::with('responsibleUser')
            ->where('event_date', '>=', $now)
            ->orderBy('event_date', 'asc')
            ->get()
            ->map(fn ($event) => $this->formatEvent($event));

        // Paginate expired events (event_date < now). Return first page in index.
        $expiredPage = max(1, (int) $request->query('expired_page', 1));
        $expiredPerPage = max(1, (int) $request->query('expired_per_page', 10));

        $expiredQuery = Event::with('responsibleUser')
            ->where('event_date', '<', $now)
            ->orderBy('event_date', 'desc');

        $expiredPaginator = $expiredQuery->paginate($expiredPerPage, ['*'], 'expired_page', $expiredPage);

        $expiredEvents = collect($expiredPaginator->items())->map(fn ($event) => $this->formatEvent($event));

        // Combine live/upcoming (all) then the first page of expired events
        $events = $liveEvents->concat($expiredEvents)->values();
        $boardUsers = User::where('permissions', 'like', '%board%')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']);

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
        return [
            'id' => $event->id,
            'name' => $event->name,
            'description' => $event->description,
            'event_date' => $event->event_date,
            'start_sell_date' => $event->start_sell_date,
            'end_sell_date' => $event->end_sell_date,
            'price_with_card' => $event->price_with_card,
            'price_without_card' => $event->price_without_card,
            'quantity' => $event->quantity,
            'responsible_user_id' => $event->responsible_user_id,
            'notes' => $event->notes,
            'variable_amount' => $event->variable_amount,
            'quantity_with_card' => $event->quantity_with_card,
            'quantity_without_card' => $event->quantity_without_card,
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

        $query = Event::with('responsibleUser')
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
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validated['variable_amount']) {
            $validated['quantity'] = -1;
        } else {
            $validated['quantity'] = $validated['quantity'] ?? -1;
            $validated['quantity_with_card'] = null;
            $validated['quantity_without_card'] = null;
        }

        Product::create($validated);

        return redirect()->route('sellables');
    }

    public function updateProduct(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:-1'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'is_online_sellable' => ['required', 'boolean'],
        ]);

        if ($validated['variable_amount']) {
            $validated['quantity'] = -1;
        } else {
            $validated['quantity'] = $validated['quantity'] ?? -1;
            $validated['quantity_with_card'] = null;
            $validated['quantity_without_card'] = null;
        }

        $product->update($validated);
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
            'event_date' => ['required', 'date'],
            'start_sell_date' => ['required', 'date'],
            'end_sell_date' => ['required', 'date', 'after:start_sell_date'],
            'price_with_card' => ['required', 'numeric', 'min:0'],
            'price_without_card' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'responsible_user_id' => ['required', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'google_spreadsheet_id' => ['nullable', 'string'],
        ]);

        if ($validated['variable_amount']) {
            $validated['quantity'] = -1;
            $validated['quantity_with_card'] = $validated['quantity_with_card'] ?? -1;
            $validated['quantity_without_card'] = $validated['quantity_without_card'] ?? -1;
        } else {
            $validated['quantity'] = $validated['quantity'] ?? -1;
            $validated['quantity_with_card'] = null;
            $validated['quantity_without_card'] = null;
        }

        Event::create($validated);

        return redirect()->route('sellables');
    }

    public function updateEvent(Request $request, Event $event)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'event_date' => ['required', 'date'],
            'start_sell_date' => ['required', 'date'],
            'end_sell_date' => ['required', 'date', 'after:start_sell_date'],
            'price_with_card' => ['required', 'numeric', 'min:0'],
            'price_without_card' => ['required', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:-1'],
            'responsible_user_id' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
            'google_spreadsheet_id' => ['nullable', 'string'],
            'is_online_sellable' => ['required', 'boolean'],
        ]);

        if ($validated['variable_amount']) {
            $validated['quantity'] = -1;
            $validated['quantity_with_card'] = $validated['quantity_with_card'] ?? -1;
            $validated['quantity_without_card'] = $validated['quantity_without_card'] ?? -1;
        } else {
            $validated['quantity'] = $validated['quantity'] ?? -1;
            $validated['quantity_with_card'] = null;
            $validated['quantity_without_card'] = null;
        }

        $event->update($validated);
    }

    public function destroyEvent(Event $event)
    {
        $event->delete();

        return redirect()->route('sellables');
    }
}