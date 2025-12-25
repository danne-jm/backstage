<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'event_id',
        'method',
        'amount',
        'details',
        'sold_at',
    ];

    protected $casts = [
        'details' => 'array',
        'amount' => 'decimal:2',
        'sold_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
