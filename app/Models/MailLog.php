<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
}
