<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OnlineSale extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'online_transaction_id',
        'office_shift_id',
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

    public function officeShift()
    {
        return $this->belongsTo(\App\Models\OfficeShift::class);
    }

    public function sellable()
    {
        return $this->morphTo();
    }

    public function product()
    {
        return $this->belongsTo(\App\Models\sellables\Product::class, 'product_id');
    }

    public function event()
    {
        return $this->belongsTo(\App\Models\sellables\Event::class, 'event_id');
    }

    public function transaction()
    {
        return $this->belongsTo(OnlineTransaction::class, 'online_transaction_id');
    }
}
