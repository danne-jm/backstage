<?php

namespace App\Http\Controllers\Backstage\Warehouse;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ItemController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $query = Item::query();

        $search = (string) $request->query('search', '');
        if (trim($search) !== '') {
            $s = trim($search);
            if (ctype_digit($s)) {
                // numeric search -> quantity exact match
                $query->where('quantity', (int) $s);
            } else {
                $lower = strtolower($s);
                $query->where(function ($q) use ($lower) {
                    $q->whereRaw('LOWER(name) LIKE ?', ["%{$lower}%"])
                        ->orWhereRaw('LOWER(changed_by) LIKE ?', ["%{$lower}%"])
                        ->orWhereRaw('LOWER(category) LIKE ?', ["%{$lower}%"]);
                });
            }
        }

        $sortCol = $request->query('sort_col');
        $sortDir = $request->query('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';

        if ($sortCol) {
            // allow only known columns
            $allowed = ['name', 'quantity', 'last_modified', 'changed_by'];
            if (in_array($sortCol, $allowed, true)) {
                if ($sortCol === 'last_modified') {
                    $query->orderBy('last_modified', $sortDir);
                } else {
                    $query->orderBy($sortCol, $sortDir);
                }
            }
        } else {
            $query->orderBy('updated_at', 'desc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $items = $query->paginate($perPage)->withQueryString();

        // Build a unique category suggestion list from existing items
        $allCats = Item::query()->pluck('category')->filter()->values()->all();
        $flat = [];
        foreach ($allCats as $cJson) {
            if (is_array($cJson)) {
                foreach ($cJson as $c) {
                    $flat[] = (string) $c;
                }
            }
        }
        $uniqueCats = array_values(array_unique(array_filter(array_map('trim', $flat))));

        return Inertia::render('Backstage/warehouse', [
            'items' => $items,
            'categories' => $uniqueCats,
        ]);
    }

    public function store(StoreItemRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['last_modified'] = now();
        $data['changed_by'] = optional($request->user())->email;

        // handle optional image upload
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('items', 'public');
            $data['image'] = $path;

            // also store a data URI representation in the database for direct rendering
            try {
                $contents = file_get_contents($file->getRealPath());
                $b64 = base64_encode($contents);
                $mime = $file->getClientMimeType() ?? 'application/octet-stream';
                $data['image_data'] = "data:{$mime};base64,{$b64}";
            } catch (\Throwable $e) {
                // if encoding to DB fails, continue without image_data
                $data['image_data'] = null;
            }
        }

        Item::create($data);

        return redirect()->route('warehouse')->with('success', 'Item created');
    }

    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $data = $request->validated();
        $data['last_modified'] = now();
        $data['changed_by'] = optional($request->user())->email;

        // handle explicit remove image request
        if ($request->boolean('remove_image')) {
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $data['image'] = null;
            $data['image_data'] = null;
        }

        // handle optional image upload; replace existing image if provided
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('items', 'public');
            // delete old image if present
            if ($item->image) {
                Storage::disk('public')->delete($item->image);
            }
            $data['image'] = $path;
            // store data URI in DB as well
            try {
                $contents = file_get_contents($file->getRealPath());
                $b64 = base64_encode($contents);
                $mime = $file->getClientMimeType() ?? 'application/octet-stream';
                $data['image_data'] = "data:{$mime};base64,{$b64}";
            } catch (\Throwable $e) {
                $data['image_data'] = null;
            }
            // ensure remove flag is reset
            $data['remove_image'] = false;
        }

        $item->update($data);

        return redirect()->route('warehouse')->with('success', 'Item updated');
    }

    public function destroy(Request $request, Item $item): RedirectResponse
    {
        // delete stored file if present
        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }
        $item->delete();

        return redirect()->route('warehouse')->with('success', 'Item deleted');
    }
}
