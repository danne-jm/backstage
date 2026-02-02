<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\EventImage;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Console\Command;

class MigrateImagesToMediaLibrary extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:migrate-images-to-media-library';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing BLOB images to Spatie Media Library';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting migration of Product Images...');

        $productImages = ProductImage::all();
        $bar = $this->output->createProgressBar(count($productImages));

        foreach ($productImages as $image) {
            $product = Product::find($image->product_id);
            if ($product) {
                try {
                    $extension = $this->mimeToExtension($image->mime_type);
                    $product->addMediaFromString($image->image_data)
                        ->usingFileName('product_'.$product->id.'_'.$image->id.'.'.$extension)
                        ->toMediaCollection('images');
                } catch (\Exception $e) {
                    $this->error("Failed to migrate ProductImage ID {$image->id}: ".$e->getMessage());
                }
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Product Images migrated.');

        $this->info('Starting migration of Event Images...');

        $eventImages = EventImage::all();
        $bar = $this->output->createProgressBar(count($eventImages));

        foreach ($eventImages as $image) {
            $event = Event::find($image->event_id);
            if ($event) {
                try {
                    $extension = $this->mimeToExtension($image->mime_type);
                    $event->addMediaFromString($image->image_data)
                        ->usingFileName('event_'.$event->id.'_'.$image->id.'.'.$extension)
                        ->toMediaCollection('images');
                } catch (\Exception $e) {
                    $this->error("Failed to migrate EventImage ID {$image->id}: ".$e->getMessage());
                }
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('All images migrated successfully.');
    }

    private function mimeToExtension($mime)
    {
        $map = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
        ];

        return $map[$mime] ?? 'jpg';
    }
}
