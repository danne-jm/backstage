<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SellablesController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('name')->get();
        $events = Event::with('responsibleUser')->orderBy('event_date', 'desc')->get()->map(function ($event) {
            return [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'event_date' => $event->event_date->toISOString(),
                'start_sell_date' => $event->start_sell_date->toISOString(),
                'end_sell_date' => $event->end_sell_date->toISOString(),
                'price_with_card' => $event->price_with_card,
                'price_without_card' => $event->price_without_card,
                'quantity' => $event->quantity,
                'responsible_user_id' => $event->responsible_user_id,
                'notes' => $event->notes,
                'variable_amount' => $event->variable_amount,
                'quantity_with_card' => $event->quantity_with_card,
                'quantity_without_card' => $event->quantity_without_card,
                'responsibleUser' => $event->responsibleUser ? [
                    'id' => $event->responsibleUser->id,
                    'first_name' => $event->responsibleUser->first_name,
                    'last_name' => $event->responsibleUser->last_name,
                ] : null,
            ];
        });
        $boardUsers = User::where('permissions', 'like', '%board%')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']);

        return Inertia::render('sellables', [
            'products' => $products,
            'events' => $events,
            'boardUsers' => $boardUsers->map(fn ($u) => [
                'id' => $u->id,
                'name' => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
                'email' => $u->email,
            ]),
        ]);
    }

    public function storeProduct(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        Product::create($validated);

        return redirect()->route('sellables');
    }

    public function updateProduct(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
        ]);

        $product->update($validated);

        return redirect()->route('sellables');
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
        ]);

        // If variable_amount is true, set quantity to null
        if ($validated['variable_amount']) {
            $validated['quantity'] = null;
        } else {
            // If not variable, clear the separate quantities
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
            'quantity' => ['nullable', 'integer', 'min:0'],
            'responsible_user_id' => ['required', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
            'variable_amount' => ['required', 'boolean'],
            'quantity_with_card' => ['nullable', 'integer', 'min:0'],
            'quantity_without_card' => ['nullable', 'integer', 'min:0'],
        ]);

        // If variable_amount is true, set quantity to null
        if ($validated['variable_amount']) {
            $validated['quantity'] = null;
        } else {
            // If not variable, clear the separate quantities
            $validated['quantity_with_card'] = null;
            $validated['quantity_without_card'] = null;
        }

        $event->update($validated);

        return redirect()->route('sellables');
    }

    public function destroyEvent(Event $event)
    {
        $event->delete();

        return redirect()->route('sellables');
    }
}
