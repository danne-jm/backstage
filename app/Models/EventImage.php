<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventImage extends Model
{
    use \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'event_id',
        'image_data',
        'mime_type',
    ];

    /**
     * The attributes that should be hidden for serialization.
     * We don't want to dump binary data in JSON responses.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'image_data',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
