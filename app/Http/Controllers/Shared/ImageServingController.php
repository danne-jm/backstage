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
     */
    public function show(Request $request, $id)
    {
        $image = EventImage::findOrFail($id);

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
     */
    public function showProduct(Request $request, $id)
    {
        $image = \App\Models\ProductImage::findOrFail($id);

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
