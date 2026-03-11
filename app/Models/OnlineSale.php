<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineSale extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'online_transaction_id',
        'reference_id',
        'product_id',
        'event_id',
        'method',
        'amount',
        'details',
        'ticket_type',
        'sold_at',
    ];

    protected $casts = [
        'details' => 'array',
        'amount' => 'decimal:2',
        'sold_at' => 'datetime',
    ];

    public function sellable()
    {
        return $this->morphTo();
    }
}
