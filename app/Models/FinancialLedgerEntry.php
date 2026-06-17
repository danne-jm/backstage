<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinancialLedgerEntry extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'entry_type',
        'direction',
        'amount',
        'channel',
        'payment_method',
        'idempotency_key',
        'transaction_id',
        'notes',
    ];
}
