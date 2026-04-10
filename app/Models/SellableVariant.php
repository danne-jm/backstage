<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SellableVariant extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = ['sellable_id', 'sellable_type', 'options', 'quantity'];

    protected $casts = [
        'options' => 'array',
        'quantity' => 'integer',
    ];

    public function sellable()
    {
        return $this->morphTo();
    }

    /**
     * Get remaining stock for this variant, computed live from actual sale records.
     * Returns null if unlimited (quantity is null).
     */
    public function getRemainingAttribute(): ?int
    {
        return $this->computedRemaining();
    }

    /**
     * Count actual sold/reserved units for this variant from real sale records.
     *
     * Online sales are counted from the moment checkout is initiated (pending) and
     * only excluded when the transaction is explicitly failed or abandoned.
     */
    public function computedSoldCount(): int
    {
        return Cache::remember("sold_count_variant_{$this->id}", 30, function () {
            $office = \App\Models\OfficeShiftSale::where('snapshot_variant_id', $this->id)->count();
            $online = \App\Models\OnlineSale::where('details_variant_id', $this->id)
                ->where(fn($q) => $q->whereNull('online_transaction_id')
                    ->orWhereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed'])))
                ->count();

            return $office + $online;
        });
    }

    public static function bustSoldCountCache(string $id): void
    {
        Cache::forget("sold_count_variant_{$id}");
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
