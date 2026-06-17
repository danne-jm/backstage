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
}
