<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\sellables\Product;
use App\Models\sellables\Event;

class OfficeController extends Controller
{
    public function index()
    {
        $products = Product::all();
        $events = Event::all();

        // Add a field "type" to events if not set by DB, or we can just let React know.
        // Actually, the JS expects "type" on products specifically in orderedSellables.
        // The frontend code maps `events` and checks `type === 'event'`.
        $events->map(function ($e) {
            $e->type = 'event';
            return $e;
        });

        $products->map(function ($p) {
            $p->type = 'product';
            return $p;
        });

        return Inertia::render('office/office', [
            'products' => $products,
            'sellables' => $events, // sellables prop conventionally represented events in the JS code
            'activeShift' => null,
            'lastShift' => null,
            'staff' => []
        ]);
    }
}
