<?php

namespace App\Models\Traits;

use App\Models\Variant;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasVariants
{
    public function variants(): MorphMany
    {
        return $this->morphMany(Variant::class, 'purchasable');
    }

    public function hasVariants(): bool
    {
        return $this->is_variant_based ?? false;
    }

    public function syncVariants(): void
    {
        if (! $this->hasVariants() || empty($this->variants_config)) {
            $this->variants()->delete();
            return;
        }

        $existingVariants = $this->variants()->get();
        $configVariants = collect($this->variants_config);

        $keptIds = [];

        foreach ($configVariants as $config) {
            $options = collect($config)->except('quantity')->toArray();
            $quantity = $config['quantity'] ?? null;

            // Find an existing variant with the exact same options
            $variant = $existingVariants->first(function ($v) use ($options) {
                return $v->options === $options;
            });

            if ($variant) {
                $variant->update(['quantity' => $quantity]);
                $keptIds[] = $variant->id;
            } else {
                $newVariant = $this->variants()->create([
                    'options' => $options,
                    'quantity' => $quantity,
                ]);
                $keptIds[] = $newVariant->id;
            }
        }

        // Delete any variants that are no longer in the config
        $this->variants()->whereNotIn('id', $keptIds)->delete();
    }
}
