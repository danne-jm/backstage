<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $id
 * @property string $transaction_id
 * @property string $purchasable_id
 * @property string $purchasable_type
 * @property string|null $variant_id
 * @property string $unit_price
 * @property int $quantity
 * @property string $subtotal
 * @property string|null $ticket_type
 * @property array|null $snapshot
 * @property bool $discount_code_used
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \App\Models\Transaction $transaction
 */
class Sale extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'transaction_id',
        'purchasable_id',
        'purchasable_type',
        'variant_id',
        'unit_price',
        'quantity',
        'subtotal',
        'ticket_type',
        'snapshot',
        'discount_code_used',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'snapshot' => 'array',
    ];

    public function transaction(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function purchasable(): \Illuminate\Database\Eloquent\Relations\MorphTo
    {
        return $this->morphTo();
    }

    public function variant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Variant::class);
    }
}
