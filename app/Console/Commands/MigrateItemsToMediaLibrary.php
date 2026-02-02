<?php

namespace App\Console\Commands;

use App\Models\Item;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class MigrateItemsToMediaLibrary extends Command
{
    protected $signature = 'app:migrate-items-to-media-library';

    protected $description = 'Migrate Item images to Spatie Media Library';

    public function handle()
    {
        $this->info('Starting migration of Item Images...');

        // Fix: Use query builder for simpler iteration or just all(). item count usually low.
        $items = Item::whereNotNull('image')->orWhereNotNull('image_data')->get();
        $bar = $this->output->createProgressBar($items->count());

        foreach ($items as $item) {
            try {
                $added = false;
                // Try file path first
                if ($item->image && Storage::disk('public')->exists($item->image)) {
                    $item->addMediaFromDisk($item->image, 'public')
                        ->preservingOriginal()
                        ->toMediaCollection('images');
                    $added = true;
                }
                // Fallback to image_data (base64)
                elseif ($item->image_data) {
                    $item->addMediaFromBase64($item->image_data)
                        ->usingFileName('item_'.$item->id.'.jpg') // Guess ext since base64 usually has mime
                        ->toMediaCollection('images');
                    $added = true;
                }

                if ($added) {
                    // Optional: Clear old columns? Not yet, wait for verify.
                }
            } catch (\Exception $e) {
                $this->error("Failed to migrate Item ID {$item->id}: ".$e->getMessage());
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Item images migrated.');
    }
}
