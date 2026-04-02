<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineTransaction extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'reference_id',
        'total_amount',
        'processing_fee',
        'discount_codes',
        'external_payment_id',
        'payment_status',
        'payment_gateway',
        'email',
        'completed_at',
        'mail_success',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'processing_fee' => 'decimal:2',
        'discount_codes' => 'array',
        'completed_at' => 'datetime',
        'mail_success' => 'boolean',
    ];

    public function sales()
    {
        return $this->hasMany(OnlineSale::class);
    }

    public function discountUsages()
    {
        return $this->hasMany(DiscountUsage::class);
    }

    public function isPending(): bool
    {
        return $this->payment_status === 'pending';
    }

    public function isCompleted(): bool
    {
        return $this->payment_status === 'completed';
    }

    public function isFailed(): bool
    {
        return in_array($this->payment_status, ['failed', 'cancelled']);
    }
}
