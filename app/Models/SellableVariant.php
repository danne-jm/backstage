<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellableVariant extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'sellable_id',
        'sellable_type',
        'options',
        'quantity',
        'sold_count',
    ];

    protected $casts = [
        'options' => 'array',
        'quantity' => 'integer',
        'sold_count' => 'integer',
    ];

    protected $appends = ['remaining'];

    public function sellable()
    {
        return $this->morphTo();
    }

    public function getRemainingAttribute()
    {
        if (is_null($this->quantity)) {
            return null;
        }

        return max(0, $this->quantity - $this->sold_count);
    }
}
