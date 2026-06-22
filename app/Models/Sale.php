<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

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
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Transaction $transaction
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

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function purchasable(): MorphTo
    {
        return $this->morphTo();
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(Variant::class);
    }
}
