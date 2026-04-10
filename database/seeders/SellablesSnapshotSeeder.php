<?php

namespace Database\Seeders;

use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Database\Seeder;

class SellablesSnapshotSeeder extends Seeder
{
    /**
     * @var array<string, string>
     */
    protected array $imagePathIndex = [];

    /**
     * Seed sellables from a snapshot export.
     *
     * This intentionally seeds only product/event catalog data
     * (including variants and images) and does not seed any sales records.
     */
    public function run(): void
    {
        $snapshotPath = database_path('seeders/sellables_snapshot.json');

        if (!file_exists($snapshotPath)) {
            $this->command?->warn("Sellables snapshot not found at {$snapshotPath}; skipping sellables snapshot seed.");
            return;
        }

        $snapshot = json_decode((string) file_get_contents($snapshotPath), true);

        if (!is_array($snapshot)) {
            $this->command?->warn('Sellables snapshot JSON is invalid; skipping sellables snapshot seed.');
            return;
        }

        foreach (($snapshot['products'] ?? []) as $productData) {
            $this->seedProduct($productData);
        }

        foreach (($snapshot['events'] ?? []) as $eventData) {
            $this->seedEvent($eventData);
        }
    }

    /**
     * @param array<string, mixed> $productData
     */
    protected function seedProduct(array $productData): void
    {
        $product = Product::updateOrCreate(
            ['name' => (string) ($productData['name'] ?? '')],
            [
                'description' => $productData['description'] ?? null,
                'variants_config' => $productData['variants_config'] ?? null,
                'is_variant_based' => (bool) ($productData['is_variant_based'] ?? false),
                'price' => (float) ($productData['price'] ?? 0),
                'member_price' => (float) ($productData['member_price'] ?? 0),
                'price_with_card' => $productData['price_with_card'] !== null
                    ? (float) $productData['price_with_card']
                    : null,
                'price_without_card' => $productData['price_without_card'] !== null
                    ? (float) $productData['price_without_card']
                    : null,
                'start_sell_date' => $productData['start_sell_date'] ?? null,
                'end_sell_date' => $productData['end_sell_date'] ?? null,
                'quantity' => $productData['quantity'] !== null
                    ? (int) $productData['quantity']
                    : null,
                'unlimited_quantity' => (bool) ($productData['unlimited_quantity'] ?? false),
                'variable_amount' => (bool) ($productData['variable_amount'] ?? false),
                'quantity_with_card' => $productData['quantity_with_card'] !== null
                    ? (int) $productData['quantity_with_card']
                    : null,
                'unlimited_quantity_with_card' => (bool) ($productData['unlimited_quantity_with_card'] ?? false),
                'quantity_without_card' => $productData['quantity_without_card'] !== null
                    ? (int) $productData['quantity_without_card']
                    : null,
                'unlimited_quantity_without_card' => (bool) ($productData['unlimited_quantity_without_card'] ?? false),
                'is_online_sellable' => (bool) ($productData['is_online_sellable'] ?? false),
                'instagram_link' => $productData['instagram_link'] ?? null,
                'type' => $productData['type'] ?? null,
            ]
        );

        $this->syncVariants($product, (array) ($productData['variants'] ?? []));
        $this->syncImages($product, (array) ($productData['images'] ?? []));
    }

    /**
     * @param array<string, mixed> $eventData
     */
    protected function seedEvent(array $eventData): void
    {
        $event = Event::updateOrCreate(
            ['name' => (string) ($eventData['name'] ?? '')],
            [
                'description' => $eventData['description'] ?? null,
                'event_date' => $eventData['event_date'] ?? null,
                'start_sell_date' => $eventData['start_sell_date'] ?? null,
                'end_sell_date' => $eventData['end_sell_date'] ?? null,
                'google_spreadsheet_id' => $eventData['google_spreadsheet_id'] ?? null,
                'google_sheet_name' => $eventData['google_sheet_name'] ?? null,
                'price_with_card' => $eventData['price_with_card'] !== null
                    ? (float) $eventData['price_with_card']
                    : null,
                'price_without_card' => $eventData['price_without_card'] !== null
                    ? (float) $eventData['price_without_card']
                    : null,
                'quantity' => $eventData['quantity'] !== null
                    ? (int) $eventData['quantity']
                    : null,
                'unlimited_quantity' => (bool) ($eventData['unlimited_quantity'] ?? false),
                'variable_amount' => (bool) ($eventData['variable_amount'] ?? false),
                'quantity_with_card' => $eventData['quantity_with_card'] !== null
                    ? (int) $eventData['quantity_with_card']
                    : null,
                'unlimited_quantity_with_card' => (bool) ($eventData['unlimited_quantity_with_card'] ?? false),
                'quantity_without_card' => $eventData['quantity_without_card'] !== null
                    ? (int) $eventData['quantity_without_card']
                    : null,
                'unlimited_quantity_without_card' => (bool) ($eventData['unlimited_quantity_without_card'] ?? false),
                'is_online_sellable' => (bool) ($eventData['is_online_sellable'] ?? false),
                'instagram_link' => $eventData['instagram_link'] ?? null,
                'notes' => $eventData['notes'] ?? null,
                'variants_config' => $eventData['variants_config'] ?? null,
                'is_variant_based' => (bool) ($eventData['is_variant_based'] ?? false),
            ]
        );

        $this->syncVariants($event, (array) ($eventData['variants'] ?? []));
        $this->syncImages($event, (array) ($eventData['images'] ?? []));
    }

    /**
     * @param array<int, array<string, mixed>> $variants
     */
    protected function syncVariants(object $sellable, array $variants): void
    {
        $existingByKey = [];

        foreach ($sellable->variants()->get() as $variant) {
            $existingByKey[$this->variantOptionsKey((array) $variant->options)] = $variant;
        }

        $seen = [];

        foreach ($variants as $variantData) {
            $options = (array) ($variantData['options'] ?? []);
            $key = $this->variantOptionsKey($options);
            $seen[$key] = true;

            $payload = [
                'options' => $options,
                'quantity' => array_key_exists('quantity', $variantData) && $variantData['quantity'] !== null
                    ? (int) $variantData['quantity']
                    : null,
            ];

            if (isset($existingByKey[$key])) {
                $existingByKey[$key]->update($payload);
            } else {
                $sellable->variants()->create($payload);
            }
        }

        foreach ($existingByKey as $key => $variant) {
            if (!isset($seen[$key])) {
                $variant->delete();
            }
        }
    }

    /**
     * @param array<int, array<string, mixed>> $images
     */
    protected function syncImages(object $sellable, array $images): void
    {
        $targetFileNames = [];
        foreach ($images as $image) {
            $fileName = (string) ($image['file_name'] ?? '');
            if ($fileName !== '') {
                $targetFileNames[] = $fileName;
            }
        }

        $existing = $sellable->getMedia('images');

        foreach ($existing as $media) {
            if (!in_array($media->file_name, $targetFileNames, true)) {
                $media->delete();
            }
        }

        $existingFileNames = $sellable->getMedia('images')->pluck('file_name')->all();

        foreach ($images as $image) {
            $fileName = (string) ($image['file_name'] ?? '');
            if ($fileName === '' || in_array($fileName, $existingFileNames, true)) {
                continue;
            }

            $relativePath = (string) ($image['path'] ?? '');
            $absolutePath = $relativePath !== ''
                ? storage_path('app/public/' . ltrim($relativePath, '/'))
                : '';

            if ($absolutePath === '' || !file_exists($absolutePath)) {
                $resolved = $this->findImagePathByFileName($fileName);
                $absolutePath = $resolved ?? '';
            }

            if ($absolutePath === '' || !file_exists($absolutePath)) {
                $this->command?->warn("Image file missing for {$sellable->name}: {$fileName}");
                continue;
            }

            $sellable
                ->addMedia($absolutePath)
                ->preservingOriginal()
                ->toMediaCollection('images', (string) ($image['disk'] ?? 'public'));
        }
    }

    protected function findImagePathByFileName(string $fileName): ?string
    {
        if ($fileName === '') {
            return null;
        }

        if ($this->imagePathIndex === []) {
            $base = storage_path('app/public');
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($base, \FilesystemIterator::SKIP_DOTS)
            );

            foreach ($iterator as $file) {
                if (!$file->isFile()) {
                    continue;
                }
                $this->imagePathIndex[$file->getFilename()] = $file->getPathname();
            }
        }

        return $this->imagePathIndex[$fileName] ?? null;
    }

    /**
     * @param array<string, mixed> $options
     */
    protected function variantOptionsKey(array $options): string
    {
        ksort($options);

        return json_encode($options, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
    }
}
