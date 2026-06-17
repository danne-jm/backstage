<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OfficeShift extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'started_by',
        'ended_by',
        'started_at',
        'ended_at',
        'status',
        'start_cash_breakdown',
        'expected_cash_total',
        'end_of_shift_cash_breakdown',
        'discrepancy_amount',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'start_cash_breakdown' => 'array',
        'end_of_shift_cash_breakdown' => 'array',
        'expected_cash_total' => 'decimal:2',
        'discrepancy_amount' => 'decimal:2',
    ];

    public function starter()
    {
        return $this->belongsTo(User::class, 'started_by');
    }

    public function ender()
    {
        return $this->belongsTo(User::class, 'ended_by');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
