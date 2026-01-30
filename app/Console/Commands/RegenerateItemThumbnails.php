<?php

namespace App\Console\Commands;

use App\Models\Item;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class RegenerateItemThumbnails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'items:regenerate-thumbnails 
                            {--all : Regenerate all thumbnails, even if already compressed}
                            {--uncompressed-only : Only regenerate uncompressed items (default)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Regenerate compressed thumbnails for all items with images';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $query = Item::where(function ($q) {
            $q->whereNotNull('image')
                ->orWhereNotNull('image_data');
        });

        // By default, only process uncompressed items unless --all flag is used
        if (! $this->option('all')) {
            $query->where(function ($q) {
                $q->where('compressed', false)
                    ->orWhereNull('compressed');
            });
        }

        $items = $query->get();

        if ($items->isEmpty()) {
            $this->info('No items need thumbnail regeneration.');

            return self::SUCCESS;
        }

        $this->info("Found {$items->count()} items with images that need compression");

        $bar = $this->output->createProgressBar($items->count());
        $bar->start();

        $success = 0;
        $failed = 0;

        foreach ($items as $item) {
            try {
                $thumbnailData = null;

                // Try to process from file system first
                if ($item->image && Storage::disk('public')->exists($item->image)) {
                    $filePath = Storage::disk('public')->path($item->image);
                    $thumbnailData = $this->createCompressedThumbnailFromFile($filePath);
                }
                // If no file, try to recompress existing image_data
                elseif ($item->image_data) {
                    $thumbnailData = $this->recompressDataUri($item->image_data);
                }

                if ($thumbnailData) {
                    $item->update([
                        'image_data' => $thumbnailData,
                        'compressed' => true,
                    ]);
                    $success++;
                } else {
                    $item->update(['compressed' => false]);
                    $failed++;
                    if ($item->image) {
                        $this->warn("\nFailed to process item #{$item->id} ({$item->name}): Image file not found or invalid");
                    }
                }
            } catch (\Throwable $e) {
                $this->error("\nFailed to process item #{$item->id} ({$item->name}): {$e->getMessage()}");
                $item->update(['compressed' => false]);
                $failed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Successfully regenerated {$success} thumbnails");

        if ($failed > 0) {
            $this->warn("Failed to regenerate {$failed} thumbnails");
        }

        return self::SUCCESS;
    }

    protected function createCompressedThumbnailFromFile(string $filePath): ?string
    {
        $maxWidth = 128;
        $maxHeight = 128;
        $quality = 100; // Reduced from 100% to 100% for smaller file size

        // Detect mime type
        $imageInfo = @getimagesize($filePath);
        if (! $imageInfo) {
            return null;
        }

        $mime = $imageInfo['mime'];

        // Create image from file
        $sourceImage = match (true) {
            str_contains($mime, 'jpeg'), str_contains($mime, 'jpg') => @imagecreatefromjpeg($filePath),
            str_contains($mime, 'png') => @imagecreatefrompng($filePath),
            str_contains($mime, 'gif') => @imagecreatefromgif($filePath),
            str_contains($mime, 'webp') => @imagecreatefromwebp($filePath),
            default => false,
        };

        if (! $sourceImage) {
            return null;
        }

        return $this->resizeAndEncode($sourceImage, $maxWidth, $maxHeight, $quality);
    }

    protected function recompressDataUri(string $dataUri): ?string
    {
        $maxWidth = 128;
        $maxHeight = 128;
        $quality = 100;

        // Extract base64 data from data URI
        if (! preg_match('/^data:image\/\w+;base64,(.+)$/', $dataUri, $matches)) {
            return null;
        }

        $imageData = base64_decode($matches[1]);
        if (! $imageData) {
            return null;
        }

        // Create image from string
        $sourceImage = @imagecreatefromstring($imageData);
        if (! $sourceImage) {
            return null;
        }

        return $this->resizeAndEncode($sourceImage, $maxWidth, $maxHeight, $quality);
    }

    protected function resizeAndEncode($sourceImage, int $maxWidth, int $maxHeight, int $quality): ?string
    {
        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        // Calculate new dimensions
        $ratio = min($maxWidth / $width, $maxHeight / $height);
        $newWidth = (int) ($width * $ratio);
        $newHeight = (int) ($height * $ratio);

        // Create thumbnail
        $thumbnail = imagecreatetruecolor($newWidth, $newHeight);

        // Preserve transparency for PNG (output will still be JPEG though)
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);

        imagecopyresampled($thumbnail, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

        // Output to buffer
        ob_start();
        imagejpeg($thumbnail, null, $quality);
        $thumbnailData = ob_get_clean();

        imagedestroy($sourceImage);
        imagedestroy($thumbnail);

        $b64 = base64_encode($thumbnailData);

        return "data:image/jpeg;base64,{$b64}";
    }
}
