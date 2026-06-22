<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string|null $event_id
 * @property string|null $user_id
 * @property string $recipient_email
 * @property string $subject
 * @property string $body
 * @property bool $success
 * @property string|null $error_message
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Event|null $event
 * @property User|null $user
 */
class MailLog extends Model
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
    ];

    protected $casts = [
        'success' => 'boolean',
    ];

    /**
     * Get the event associated with the log.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Get the user who sent the email.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
