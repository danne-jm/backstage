<?php

namespace App\Http\Controllers\Shared;

use App\Http\Controllers\Controller;
use App\Models\EventImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ImageServingController extends Controller
{
    /**
     * Serve an event image.
     * SECURITY: Only serve images for events that are publicly sellable.
     */
    public function show(Request $request, $id)
    {
        $image = EventImage::findOrFail($id);

        // SECURITY FIX: Prevent IDOR/enumeration of private/draft event images.
        // Only serve images for events that are published (is_online_sellable).
        if ($image->event && ! $image->event->is_online_sellable) {
            abort(404);
        }

        $content = $image->image_data;
        if (is_resource($content)) {
            $content = stream_get_contents($content);
        }

        return Response::make($content, 200, [
            'Content-Type' => $image->mime_type,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * Serve a product image.
     * SECURITY: Only serve images for products that are publicly sellable.
     */
    public function showProduct(Request $request, $id)
    {
        $image = \App\Models\ProductImage::findOrFail($id);

        // SECURITY FIX: Prevent IDOR/enumeration of private/draft product images.
        if ($image->product && ! $image->product->is_online_sellable) {
            abort(404);
        }

        $content = $image->image_data;
        if (is_resource($content)) {
            $content = stream_get_contents($content);
        }

        return Response::make($content, 200, [
            'Content-Type' => $image->mime_type,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
