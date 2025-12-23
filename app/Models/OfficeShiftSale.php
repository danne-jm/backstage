<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficeShiftSale extends Model
{
    use HasFactory;

    protected $fillable = ['office_shift_id', 'product_id', 'event_id', 'method', 'amount', 'description', 'sold_by', 'sold_at', 'snapshot'];

    protected $casts = [
        'sold_at' => 'datetime',
        'snapshot' => 'array',
    ];

    public function shift()
    {
        return $this->belongsTo(OfficeShift::class, 'office_shift_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
