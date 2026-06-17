<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'event_id',
        'ticket_code',
        'email',
        'first_name',
        'last_name',
        'scan_count',
        'scan_details',
        'scanned_at',
    ];

    protected $casts = [
        'scan_details' => 'array',
        'scanned_at' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }
}
