<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventTicket extends Model
{
    use HasFactory;

    // Store tickets in the separate 'tickets' connection

    protected $table = 'event_tickets';

    protected $fillable = [
        'event_id',
        'first_name',
        'last_name',
        'email',
        'event_name',
        'event_date',
        'unique_trait',
        'ticket_id',
        'scan_count',
        'scan_details',
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'scan_count' => 'integer',
        'scan_details' => 'array',
    ];
}
