<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function purchasable()
    {
        return $this->morphTo();
    }

    public function variant()
    {
        return $this->belongsTo(Variant::class);
    }
}
