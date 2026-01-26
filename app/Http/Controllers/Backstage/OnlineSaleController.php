<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Services\SaleService;
use Illuminate\Http\Request;

class OnlineSaleController extends Controller
{
    public function __construct(protected SaleService $service) {}

    /**
     * Store a new online sale. Accepts optional office_shift_id to also record it on a shift.
     * NOTE: This is a public-facing endpoint (no login required for store purchases).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['nullable', 'string', 'exists:products,id'],
            'event_id' => ['nullable', 'string', 'exists:events,id'],
            'method' => ['required', 'string', 'in:cash,card'],
            'amount' => ['required', 'numeric', 'min:0'],
            'ticket_type' => ['nullable', 'string'],
            'office_shift_id' => ['nullable', 'string', 'exists:office_shifts,id'],
            'description' => ['nullable', 'string'],
            'is_manual_entry' => ['nullable', 'boolean'],
            // SECURITY FIX: Removed sold_by from user input to prevent impersonation.
            // sold_by will be set server-side based on authentication status.
        ]);

        $payload = $validated;
        // Add optional details
        $payload['details'] = $request->input('details', null);
        $payload['sold_at'] = $request->input('sold_at', now());
        $payload['ticket_label'] = $request->input('ticket_label', null);
        $payload['name'] = $request->input('name', null);
        $payload['is_manual_entry'] = $validated['is_manual_entry'] ?? false;

        // SECURITY FIX: Set sold_by server-side. For public purchases, it's null.
        // For authenticated users (staff), use their ID.
        $payload['sold_by'] = auth()->id();
        $payload['sold_by_name'] = auth()->user()?->name;

        $sale = $this->service->createOnlineSale($payload);

        if (! empty($payload['office_shift_id'])) {
            \App\Events\OfficeSaleCreated::dispatch($payload['office_shift_id'], $sale);
        }
        \App\Events\StoreUpdated::dispatch($sale);

        // If it's a product or event, inventory might have changed
        if ($sale->product_id) {
            $p = \App\Models\Product::find($sale->product_id);
            if ($p) {
                \App\Events\InventoryUpdated::dispatch($p->id, 'product', $p->remaining);
            }
        } elseif ($sale->event_id) {
            $ev = \App\Models\Event::find($sale->event_id);
            if ($ev) {
                \App\Events\InventoryUpdated::dispatch($ev->id, 'event', $ev->remaining, $ev->remaining_with_card, $ev->remaining_without_card);
            }
        }

        return response()->json(['success' => true, 'sale' => $sale]);
    }
}
