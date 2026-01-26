<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OnlineTransaction extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'reference_id',
        'total_amount',
        'processing_fee',
        'discount_codes',
        'completed_at',
        'external_payment_id',
        'payment_status',
        'payment_gateway',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'processing_fee' => 'decimal:2',
        'discount_codes' => 'array',
        'completed_at' => 'datetime',
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(OnlineSale::class);
    }

    /**
     * Check if the payment is pending.
     */
    public function isPending(): bool
    {
        return $this->payment_status === 'pending';
    }

    /**
     * Check if the payment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->payment_status === 'completed';
    }

    /**
     * Check if the payment failed.
     */
    public function isFailed(): bool
    {
        return in_array($this->payment_status, ['failed', 'cancelled']);
    }
}
