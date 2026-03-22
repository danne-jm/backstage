<?php
require __DIR__ . '/../../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Sellable;
use App\Models\SellableVariant;

echo "Checking sellables...\n";
$s = Sellable::whereNotNull('variants_config')->first();

if ($s) {
    echo "Found sellable with config: " . $s->name . "\n";
    $count = SellableVariant::where('sellable_id', $s->id)->count();
    if ($count === 0) {
        // Create 2 variants
        $s->variants()->create([
            'id' => (string) str_replace('.', '', uniqid('', true)),
            'options' => ['Size' => 'M'],
            'quantity' => 10,
            'sold_count' => 0
        ]);
        $s->variants()->create([
            'id' => (string) str_replace('.', '', uniqid('', true)),
            'options' => ['Size' => 'L'],
            'quantity' => 15,
            'sold_count' => 0
        ]);
        echo "Created 2 sample variants!\n";
    } else {
        echo "Already has $count variants\n";
    }
} else {
    echo "No sellable with variants_config found.\n";
}
