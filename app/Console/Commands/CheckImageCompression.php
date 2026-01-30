<?php

namespace App\Console\Commands;

use App\Models\Item;
use Illuminate\Console\Command;

class CheckImageCompression extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'items:check-compression';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check compression status of items with images';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $totalWithImages = Item::where(function ($q) {
            $q->whereNotNull('image')
                ->orWhereNotNull('image_data');
        })->count();

        $compressed = Item::where('compressed', true)->count();

        $uncompressed = Item::where(function ($q) {
            $q->whereNotNull('image')
                ->orWhereNotNull('image_data');
        })
            ->where(function ($q) {
                $q->where('compressed', false)
                    ->orWhereNull('compressed');
            })
            ->count();

        $this->info('Image Compression Status');
        $this->info('========================');
        $this->table(
            ['Status', 'Count'],
            [
                ['Total items with images', $totalWithImages],
                ['Compressed', $compressed],
                ['Uncompressed/Missing', $uncompressed],
            ]
        );

        if ($uncompressed > 0) {
            $this->warn("\n{$uncompressed} items need compression.");
            $this->info('Run: php artisan items:regenerate-thumbnails');

            // Show which items need compression
            $items = Item::where(function ($q) {
                $q->whereNotNull('image')
                    ->orWhereNotNull('image_data');
            })
                ->where(function ($q) {
                    $q->where('compressed', false)
                        ->orWhereNull('compressed');
                })
                ->get(['id', 'name', 'image']);

            $this->newLine();
            $this->info('Items needing compression:');
            foreach ($items as $item) {
                $this->line("  - {$item->name} (ID: {$item->id})");
            }
        } else {
            $this->info("\n✓ All items with images are compressed!");
        }

        return self::SUCCESS;
    }
}
