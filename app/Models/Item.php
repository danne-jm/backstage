<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Item extends Model
{
    use HasFactory;

    protected $table = 'items';

    protected $fillable = [
        'name',
        'quantity',
        'category',
        'image',
        'image_data',
        'last_modified',
        'changed_by',
    ];

    protected $casts = [
        'category' => 'array',
        'last_modified' => 'datetime',
    ];

    // expose an image_url attribute for convenient rendering on the frontend
    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        // Prefer in-DB image data (data URI) if present
        if ($this->image_data) {
            return $this->image_data;
        }

        if (! $this->image) {
            return null;
        }

        // storage:link should be configured; Storage::url will resolve the public URL
        return Storage::url($this->image);
    }
}
