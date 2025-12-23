<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $event_id
 * @property int|null $user_id
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
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'ticket_code',
        'first_name',
        'last_name',
        'email',
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

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
