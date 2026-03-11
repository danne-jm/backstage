<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellableVariant extends Model
{
    use HasFactory, HasUlids;

    protected $guarded = []; // Allow mass assignment for now as it handles complex logic

    protected $casts = [
        'options' => 'array',
        'quantity' => 'integer',
        'sold_count' => 'integer',
    ];

    public function sellable()
    {
        return $this->morphTo();
    }

    /**
     * Get remaining stock for this variant.
     * Returns null if unlimited (quantity is null).
     */
    public function getRemainingAttribute(): ?int
    {
        if ($this->quantity === null) {
            return null;
        }

        return max(0, $this->quantity - ($this->sold_count ?? 0));
    }
}
