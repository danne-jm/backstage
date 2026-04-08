<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellableVariant extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['sellable_id', 'sellable_type', 'options', 'quantity', 'sold_count'];

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

    /**
     * Count actual sold/reserved units for this variant from real sale records.
     *
     * Mirrors the semantics of the cached sold_count column: online sales are counted
     * from the moment checkout is initiated (pending) and only removed when the
     * transaction is explicitly failed or abandoned.  Counting only 'completed' sales
     * would undercount during active sessions.
     */
    public function computedSoldCount(): int
    {
        $office = \App\Models\OfficeShiftSale::where('snapshot_variant_id', $this->id)->count();
        $online = \App\Models\OnlineSale::where('details_variant_id', $this->id)
            ->whereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed']))
            ->count();

        return $office + $online;
    }

    /**
     * Compute remaining live from actual sales records.
     * Returns null when unlimited.
     */
    public function computedRemaining(): ?int
    {
        if ($this->quantity === null) {
            return null;
        }
        return max(0, $this->quantity - $this->computedSoldCount());
    }
}
