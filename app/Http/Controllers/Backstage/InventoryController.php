<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\SaveItemRequest;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('backstage/inventory/index', [
            'items' => Item::orderBy('name')->get()->map(fn (Item $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'category' => $item->category,
                'updated_at' => $item->updated_at->toIso8601String(),
            ]),
        ]);
    }

    public function store(SaveItemRequest $request): RedirectResponse
    {
        Item::create($request->validated());

        return to_route('backstage.inventory.index')
            ->with('success', 'Item added to inventory.');
    }

    public function update(SaveItemRequest $request, Item $item): RedirectResponse
    {
        $item->update($request->validated());

        return to_route('backstage.inventory.index')
            ->with('success', 'Item updated.');
    }

    public function destroy(Item $item): RedirectResponse
    {
        $item->delete();

        return to_route('backstage.inventory.index')
            ->with('success', 'Item removed from inventory.');
    }
}
