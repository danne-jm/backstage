<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

/**
 * Ticket model
 * Represents event tickets with QR codes for scanning
 * 
 * @property string $id
 * @property string $event_id
 * @property string|null $user_id
 * @property string $ticket_code
 * @property string|null $first_name
 * @property string|null $last_name
 * @property string $email
 * @property string|null $event_name
 * @property string|null $event_date
 * @property string|null $unique_trait
 * @property int $scan_count
 * @property array|null $scan_details
 * @property array|null $metadata
 * @property \Illuminate\Support\Carbon|null $scanned_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Ticket extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'event_id',
        'user_id',
        'ticket_code',
        'first_name',
        'last_name',
        'email',
        'event_name',
        'event_date',
        'unique_trait',
        'scan_count',
        'scan_details',
        'metadata',
        'scanned_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'scan_details' => 'array',
            'scanned_at' => 'datetime',
            'scan_count' => 'integer',
        ];
    }

    /**
     * Get the event associated with the ticket
     */
    public function event()
    {
        return $this->belongsTo(Sellable::class, 'event_id');
    }

    /**
     * Get the user who created/owns the ticket
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
