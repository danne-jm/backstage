<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficeShiftSale extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = ['office_shift_id', 'product_id', 'event_id', 'method', 'amount', 'description', 'snapshot', 'breakdown', 'sold_by', 'sold_at'];

    protected $casts = [
        'snapshot' => 'array',
        'breakdown' => 'array',
        'amount' => 'decimal:2',
        'sold_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(\App\Models\sellables\Product::class);
    }

    public function event()
    {
        return $this->belongsTo(\App\Models\sellables\Event::class);
    }

    public function soldBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'sold_by');
    }
}
