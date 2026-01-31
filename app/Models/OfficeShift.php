<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity; // Added this use statement for LogsActivity

class OfficeShift extends Model
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids, LogsActivity; // Combined traits and added HashableId

    public function getActivitylogOptions(): \Spatie\Activitylog\LogOptions
    {
        return \Spatie\Activitylog\LogOptions::defaults()
            ->logOnly(['*'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    // Define the canonical list of denominations (notes first, then coins)
    public const DENOMINATIONS = [
        '500e', '200e', '100e', '50e', '20e', '10e', '5e', // Notes
        '2e', '1e', '50c', '20c', '10c', '5c', '2c', '1c',  // Coins
        'token', // Added to allow persistence of token counts
    ];

    protected $fillable = [
        'started_by',
        'started_at',
        'ended_at',
        'cash_total',
        'card_total',
        'start_cash',
        'start_card',
        'cash_breakdown',
        'start_cash_breakdown',
        'end_of_shift_cash_breakdown',
        'status',
        'notes',
        'total_cash',
        'total_card',
    ];

    protected $casts = [
        'cash_breakdown' => 'array',
        'start_cash_breakdown' => 'array',
        'end_of_shift_cash_breakdown' => 'array',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'cash_total' => 'decimal:2',
        'card_total' => 'decimal:2',
        'start_cash' => 'decimal:2',
        'start_card' => 'decimal:2',
        'total_cash' => 'decimal:2',
        'total_card' => 'decimal:2',
    ];

    /**
     * Compute total amount (in euros) from a breakdown array keyed by denomination keys.
     * Accepts keys from DENOMINATIONS constant: 500e, 200e, 100e, 50e, 20e, 10e, 5e, 2e, 1e, 50c, 20c, 10c, 5c, 2c, 1c
     */
    public function totalFromBreakdown(?array $breakdown): float
    {
        if (empty($breakdown) || ! is_array($breakdown)) {
            return 0.0;
        }

        $map = [
            '500e' => 500.0,
            '200e' => 200.0,
            '100e' => 100.0,
            '50e' => 50.0,
            '20e' => 20.0,
            '10e' => 10.0,
            '5e' => 5.0,
            '2e' => 2.0,
            '1e' => 1.0,
            '50c' => 0.50,
            '20c' => 0.20,
            '10c' => 0.10,
            '5c' => 0.05,
            '2c' => 0.02,
            '1c' => 0.01,
            'token' => 0.0,
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

    /**
     * Merge two cash breakdown arrays.
     */
    public static function mergeBreakdowns(?array $b1, ?array $b2): array
    {
        $merged = [];
        foreach (self::DENOMINATIONS as $denom) {
            $val1 = isset($b1[$denom]) ? intval($b1[$denom]) : 0;
            $val2 = isset($b2[$denom]) ? intval($b2[$denom]) : 0;
            $merged[$denom] = $val1 + $val2;
        }

        return $merged;
    }
}
