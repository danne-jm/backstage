<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'channel',
        'status',
        'office_shift_id',
        'customer_email',
        'total_amount',
        'discount_total',
        'payment_method',
        'external_payment_id',
        'cash_tendered_amount',
        'cash_change_amount',
        'cash_tendered_breakdown',
        'cash_change_breakdown',
        'completed_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'cash_tendered_amount' => 'decimal:2',
        'cash_change_amount' => 'decimal:2',
        'cash_tendered_breakdown' => 'array',
        'cash_change_breakdown' => 'array',
        'completed_at' => 'datetime',
    ];

    public function officeShift()
    {
        return $this->belongsTo(OfficeShift::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
