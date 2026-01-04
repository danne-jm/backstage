<?php

namespace App\Http\Controllers;

use App\Services\SaleService;
use Illuminate\Http\Request;

class OnlineSaleController extends Controller
{
    public function __construct(protected SaleService $service) {}

    /**
     * Store a new online sale. Accepts optional office_shift_id to also record it on a shift.
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
            'sold_by' => ['nullable', 'integer', 'exists:users,id'],
            'sold_by_email' => ['nullable', 'string'],
        ]);

        $payload = $validated;
        // Add optional details
        $payload['details'] = $request->input('details', null);
        $payload['sold_at'] = $request->input('sold_at', now());
        $payload['ticket_label'] = $request->input('ticket_label', null);
        $payload['name'] = $request->input('name', null);

        $sale = $this->service->createOnlineSale($payload);

        return response()->json(['success' => true, 'sale' => $sale]);
    }
}
