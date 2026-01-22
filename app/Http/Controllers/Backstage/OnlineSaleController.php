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
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'event_id' => ['nullable', 'integer', 'exists:events,id'],
            'method' => ['required', 'in:card,cash'],
            'amount' => ['required', 'numeric'],
            'ticket_type' => ['nullable', 'string'],
            'office_shift_id' => ['nullable', 'integer', 'exists:office_shifts,id'],
            'description' => ['nullable', 'string'],
            // SECURITY FIX: Removed sold_by from user input to prevent impersonation.
            // sold_by will be set server-side based on authentication status.
        ]);

        $payload = $validated;
        // Add optional details
        $payload['details'] = $request->input('details', null);
        $payload['sold_at'] = $request->input('sold_at', now());
        $payload['ticket_label'] = $request->input('ticket_label', null);
        $payload['name'] = $request->input('name', null);

        // SECURITY FIX: Set sold_by server-side. For public purchases, it's null.
        // For authenticated users (staff), use their ID.
        $payload['sold_by'] = auth()->id();
        $payload['sold_by_email'] = auth()->user()?->email;

        $sale = $this->service->createOnlineSale($payload);

        return response()->json(['success' => true, 'sale' => $sale]);
    }
}
