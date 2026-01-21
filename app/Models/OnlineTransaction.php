<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OnlineTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'token',
        'total_amount',
        'processing_fee',
        'discount_codes',
        'completed_at',
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
}
