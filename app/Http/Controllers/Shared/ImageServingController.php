<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\Response;

class ImageServingController extends Controller
{
    /**
     * Serve an event image.
     * SECURITY: Only serve images for events that are publicly sellable.
     */
    public function show(Request $request, string $id)
    {
        $media = Media::findOrFail($id);

        $event = Event::find($media->model_id);

        if (! $event || ! $event->is_online_sellable) {
            abort(404);
        }

        return $this->serveMedia($media);
    }

    /**
     * Serve a product image.
     * SECURITY: Only serve images for products that are publicly sellable.
     */
    public function showProduct(Request $request, string $id)
    {
        $media = Media::findOrFail($id);

        $product = Product::find($media->model_id);

        if (! $product || ! $product->is_online_sellable) {
            abort(404);
        }

        return $this->serveMedia($media);
    }

    private function serveMedia(Media $media): Response
    {
        $path = $media->hasGeneratedConversion('optimized')
            ? $media->getPath('optimized')
            : $media->getPath();

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path, [
            'Content-Type' => $media->mime_type,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
