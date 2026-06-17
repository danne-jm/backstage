<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\SaveItemRequest;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(): Response
    {
        $items = Item::orderBy('name')->get();

        $allTags = $items
            ->pluck('category')
            ->filter()
            ->flatten()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return Inertia::render('backstage/inventory/index', [
            'items' => $items->map(fn (Item $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => $item->quantity,
                'category' => $item->category,
                'image_path' => $item->image_path
                    ? Storage::url($item->image_path)
                    : null,
                'changed_by' => $item->changed_by,
                'updated_at' => $item->updated_at->toIso8601String(),
            ]),
            'allTags' => $allTags,
        ]);
    }

    public function store(SaveItemRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['changed_by'] = $request->user()?->email;

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('inventory', 'public');
        }

        Item::create($data);

        return to_route('backstage.inventory.index')
            ->with('success', 'Item added to inventory.');
    }

    public function update(SaveItemRequest $request, Item $item): RedirectResponse
    {
        $data = $request->validated();
        $data['changed_by'] = $request->user()?->email;

        if ($request->hasFile('image')) {
            if ($item->image_path) {
                Storage::disk('public')->delete($item->image_path);
            }
            $data['image_path'] = $request->file('image')->store('inventory', 'public');
        }

        $item->update($data);

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
