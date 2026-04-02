<?php

namespace App\Http\Controllers\Backstage;
use App\Http\Controllers\Controller;

use App\Events\InventoryUpdated;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class InventoryController extends Controller
{
    public function index(): InertiaResponse
    {
        $items = Item::query()
            ->orderBy('updated_at', 'desc')
            ->paginate(200)
            ->withQueryString();

        $categories = $this->resolveCategories();

        return Inertia::render('inventory', [
            'items'      => $items,
            'categories' => $categories,
        ]);
    }

    public function store(StoreItemRequest $request): RedirectResponse
    {
        $data                  = $request->validated();
        $data['last_modified'] = now();
        $data['changed_by']    = optional($request->user())->email;

        $item = Item::create($data);

        if ($request->hasFile('image')) {
            $item->addMedia($request->file('image'))->toMediaCollection('images');
        }

        InventoryUpdated::dispatch(
            $item->id,
            'item_created',
            $item->quantity,
            null,
            null,
            $item->append('image_url')->toArray(),
        );

        return redirect()->route('inventory')->with('success', 'Item created.');
    }

    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $data                  = $request->validated();
        $data['last_modified'] = now();
        $data['changed_by']    = optional($request->user())->email;

        if ($request->boolean('remove_image')) {
            $item->clearMediaCollection('images');
        }

        if ($request->hasFile('image')) {
            $item->clearMediaCollection('images');
            $item->addMedia($request->file('image'))->toMediaCollection('images');
        }

        unset($data['image'], $data['remove_image']);

        $item->update($data);

        InventoryUpdated::dispatch($item->id, 'item', $item->quantity);

        return redirect()->route('inventory')->with('success', 'Item updated.');
    }

    public function increment(Request $request, Item $item): RedirectResponse
    {
        $item->increment('quantity');
        $item->update([
            'last_modified' => now(),
            'changed_by'    => optional($request->user())->email,
        ]);

        InventoryUpdated::dispatch($item->id, 'item', $item->quantity);

        return redirect()->route('inventory');
    }

    public function decrement(Request $request, Item $item): RedirectResponse
    {
        if ($item->quantity > 0) {
            $item->decrement('quantity');
        }

        $item->update([
            'last_modified' => now(),
            'changed_by'    => optional($request->user())->email,
        ]);

        InventoryUpdated::dispatch($item->id, 'item', $item->quantity);

        return redirect()->route('inventory');
    }

    public function destroy(Item $item): RedirectResponse
    {
        $itemId = $item->id;
        $item->delete();

        InventoryUpdated::dispatch($itemId, 'item_deleted', 0);

        return redirect()->route('inventory')->with('success', 'Item deleted.');
    }

    private function resolveCategories(): array
    {
        $allCats = Item::query()->pluck('category')->filter()->values()->all();
        $flat    = [];

        foreach ($allCats as $categoryJson) {
            if (is_array($categoryJson)) {
                foreach ($categoryJson as $cat) {
                    $flat[] = (string) $cat;
                }
            }
        }

        return array_values(array_unique(array_filter(array_map('trim', $flat))));
    }
}
