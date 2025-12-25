<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Product;
use App\Models\OnlineSale;
use App\Models\OnlineSellable;
use Illuminate\Http\Request;

class StoreManagerController extends Controller
{
    /**
     * Return sellables (products + upcoming events) for the Store Manager page.
     */
    public function data(Request $request)
    {
        $now = now();

        $products = Product::orderBy('name')->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'type' => 'product',
                'name' => $p->name,
                'description' => $p->description,
                'price' => $p->price,
                'quantity' => $p->quantity,
                'variable_amount' => $p->variable_amount,
                'quantity_with_card' => $p->quantity_with_card,
                'quantity_without_card' => $p->quantity_without_card,
                'remaining' => $p->remaining,
                'remaining_with_card' => $p->remaining_with_card,
                'remaining_without_card' => $p->remaining_without_card,
            ];
        });

        $events = Event::with('responsibleUser')
            ->where('event_date', '>=', $now)
            ->orderBy('event_date', 'asc')
            ->get()
            ->map(function ($e) {
                return [
                    'id' => $e->id,
                    'type' => 'event',
                    'name' => $e->name,
                    'description' => $e->description,
                    'event_date' => $e->event_date,
                    'start_sell_date' => $e->start_sell_date,
                    'end_sell_date' => $e->end_sell_date,
                    'price_with_card' => $e->price_with_card,
                    'price_without_card' => $e->price_without_card,
                    'quantity' => $e->quantity,
                    'variable_amount' => $e->variable_amount,
                    'quantity_with_card' => $e->quantity_with_card,
                    'quantity_without_card' => $e->quantity_without_card,
                    'remaining' => $e->remaining,
                    'remaining_with_card' => $e->remaining_with_card,
                    'remaining_without_card' => $e->remaining_without_card,
                    'responsibleUser' => $e->responsibleUser,
                ];
            });

        $onlineSales = OnlineSale::with(['product', 'event'])
            ->orderBy('sold_at', 'desc')
            ->limit(10)
            ->get();

        $onlineSellablesCount = OnlineSellable::count();

        return response()->json([
            'products' => $products,
            'events' => $events,
            'onlineSales' => $onlineSales,
            'onlineSellablesCount' => $onlineSellablesCount,
        ]);
    }
}
