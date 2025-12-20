<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficeShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'started_by',
        'started_at',
        'ended_at',
        'cash_total',
        'cash_breakdown',
        'start_cash_breakdown',
        'card_total',
        'status',
        'notes',
        'workers',
        'sales',
    ];

    protected $casts = [
        'workers' => 'array',
        'sales' => 'array',
        'cash_breakdown' => 'array',
        'start_cash_breakdown' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Compute total amount (in euros) from a breakdown array keyed by denomination keys.
     * Accepts keys: 50,20,10,5,2,1,0_50,0_20,0_10,token
     */
    public function totalFromBreakdown(?array $breakdown): float
    {
        if (empty($breakdown) || ! is_array($breakdown)) {
            return 0.0;
        }

        $map = [
            '50' => 50.0,
            '20' => 20.0,
            '10' => 10.0,
            '5' => 5.0,
            '2' => 2.0,
            '1' => 1.0,
            '0_50' => 0.5,
            '0_20' => 0.2,
            '0_10' => 0.1,
            'token' => 0.0, // token has no euro value (it's a jeton), keep separate if needed
        ];

        $total = 0.0;
        foreach ($map as $k => $v) {
            $count = isset($breakdown[$k]) ? intval($breakdown[$k]) : 0;
            $total += $count * $v;
        }

        return (float) $total;
    }

    public function sales()
    {
        return $this->hasMany(OfficeShiftSale::class);
    }

    public function workers()
    {
        return $this->hasMany(OfficeShiftWorker::class);
    }
}
