<?php

namespace App\Actions;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class UploadImageAction
{
    /**
     * Uploads, resizes, and converts an image to webp format.
     *
     * @param UploadedFile $file The uploaded file.
     * @param string $directory The storage directory (e.g., 'inventory', 'events', 'products').
     * @param string|null $oldImagePath The path of the old image to delete.
     * @param int $maxWidth The maximum width to scale the image to.
     * @param int $quality The quality of the webp conversion (0-100).
     * @return string The path to the newly saved image.
     */
    public function handle(
        UploadedFile $file,
        string $directory,
        ?string $oldImagePath = null,
        int $maxWidth = 1200,
        int $quality = 80
    ): string {
        // Delete old image if provided
        if ($oldImagePath && Storage::disk('public')->exists($oldImagePath)) {
            Storage::disk('public')->delete($oldImagePath);
        }

        // Initialize Intervention Image Manager with GD driver
        $manager = new ImageManager(new Driver());
        
        // Read the image
        $image = $manager->decodePath($file->getPathname());

        // Scale down if wider than $maxWidth, maintaining aspect ratio
        if ($image->width() > $maxWidth) {
            $image->scaleDown(width: $maxWidth);
        }

        // Convert to WebP
        $encoded = $image->encode(new \Intervention\Image\Encoders\WebpEncoder(quality: $quality));

        // Generate a unique filename
        $filename = Str::uuid()->toString() . '.webp';
        $path = trim($directory, '/') . '/' . $filename;

        // Store the optimized image
        Storage::disk('public')->put($path, (string) $encoded);

        return $path;
    }
}
