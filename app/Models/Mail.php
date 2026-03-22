<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

/**
 * Mail log model
 * Tracks sent emails for distribution and auditing
 */
class Mail extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'event_id',
        'user_id',
        'recipient_email',
        'subject',
        'body',
        'success',
        'error_message',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'success' => 'boolean',
    ];

    /**
     * Get the user who sent the mail
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the event associated with the mail
     */
    public function event()
    {
        return $this->belongsTo(\App\Models\sellables\Event::class, 'event_id');
    }
}
