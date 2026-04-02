<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscountUsage extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'code',
        'online_transaction_id',
        'online_sale_id',
        'product_id',
        'event_id',
        'original_price',
        'paid_price',
        'saved_amount',
        'used_at',
    ];

    protected $casts = [
        'used_at' => 'datetime',
        'original_price' => 'decimal:2',
        'paid_price' => 'decimal:2',
        'saved_amount' => 'decimal:2',
    ];

    public function transaction()
    {
        return $this->belongsTo(OnlineTransaction::class, 'online_transaction_id');
    }

    public function sale()
    {
        return $this->belongsTo(OnlineSale::class, 'online_sale_id');
    }
}
