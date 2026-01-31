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

            // Compress and store a thumbnail as data URI for faster page loads
            try {
                $this->createCompressedThumbnail($file, $data);
                $data['compressed'] = true;
            } catch (\Throwable $e) {
                // if encoding to DB fails, continue without image_data
                $data['image_data'] = null;
                $data['compressed'] = false;
            }
        }

        $item = Item::create($data);

        \App\Events\InventoryUpdated::dispatch($item->id, 'item_created', $item->quantity, null, null, $item->toArray());

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
            $data['compressed'] = false;
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
            // Compress and store a thumbnail as data URI for faster page loads
            try {
                $this->createCompressedThumbnail($file, $data);
                $data['compressed'] = true;
            } catch (\Throwable $e) {
                $data['image_data'] = null;
                $data['compressed'] = false;
            }
            // ensure remove flag is reset
            $data['remove_image'] = false;
        }

        $item->update($data);

        \App\Events\InventoryUpdated::dispatch($item->id, 'item', $item->quantity);

        return redirect()->route('warehouse')->with('success', 'Item updated');
    }

    public function destroy(Request $request, Item $item): RedirectResponse
    {
        // delete stored file if present
        if ($item->image) {
            Storage::disk('public')->delete($item->image);
        }
        $item->delete();

        \App\Events\InventoryUpdated::dispatch($item->id, 'item_deleted', 0);

        return redirect()->route('warehouse')->with('success', 'Item deleted');
    }

    /**
     * Create a compressed thumbnail and store as data URI
     */
    protected function createCompressedThumbnail($file, array &$data): void
    {
        $maxWidth = 600;
        $maxHeight = 600;
        $quality = 85; // 85% is a good balance between quality and file size

        $mime = $file->getClientMimeType() ?? 'image/jpeg';
        $filePath = $file->getRealPath();

        // Create image from file
        $sourceImage = match (true) {
            str_contains($mime, 'jpeg'), str_contains($mime, 'jpg') => @imagecreatefromjpeg($filePath),
            str_contains($mime, 'png') => @imagecreatefrompng($filePath),
            str_contains($mime, 'gif') => @imagecreatefromgif($filePath),
            str_contains($mime, 'webp') => @imagecreatefromwebp($filePath),
            default => false,
        };

        if (! $sourceImage) {
            $data['image_data'] = null;

            return;
        }

        // Handle EXIF rotation for JPEGs
        if ((str_contains($mime, 'jpeg') || str_contains($mime, 'jpg')) && function_exists('exif_read_data')) {
            $exif = @exif_read_data($filePath);
            if (! empty($exif['Orientation'])) {
                switch ($exif['Orientation']) {
                    case 3:
                        $sourceImage = imagerotate($sourceImage, 180, 0);
                        break;
                    case 6:
                        $sourceImage = imagerotate($sourceImage, -90, 0);
                        break;
                    case 8:
                        $sourceImage = imagerotate($sourceImage, 90, 0);
                        break;
                }
            }
        }

        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        // Calculate new dimensions
        $ratio = min($maxWidth / $width, $maxHeight / $height);
        $newWidth = (int) ($width * $ratio);
        $newHeight = (int) ($height * $ratio);

        // Create thumbnail
        $thumbnail = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG
        if (str_contains($mime, 'png')) {
            imagealphablending($thumbnail, false);
            imagesavealpha($thumbnail, true);
        }

        imagecopyresampled($thumbnail, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Output to buffer
        ob_start();
        imagejpeg($thumbnail, null, $quality);
        $thumbnailData = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($thumbnail);

        $b64 = base64_encode($thumbnailData);
        $data['image_data'] = "data:image/jpeg;base64,{$b64}";
    }
}
