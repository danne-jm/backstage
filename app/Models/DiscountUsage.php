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
        'transaction_id',
        'sale_id',
        'purchasable_id',
        'purchasable_type',
        'original_amount',
        'paid_amount',
        'saved_amount',
    ];
}
