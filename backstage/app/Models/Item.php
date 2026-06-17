<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Item extends Model implements HasMedia
{
    use HasFactory, \Illuminate\Database\Eloquent\Concerns\HasUlids, InteractsWithMedia, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $table = 'items';

    protected $fillable = [
        'name',
        'quantity',
        'category',
        'image',
        'image_data',
        'compressed',
        'last_modified',
        'changed_by',
    ];

    protected $casts = [
        'category' => 'array',
        'last_modified' => 'datetime',
        'compressed' => 'boolean',
    ];

    // expose an image_url attribute for convenient rendering on the frontend
    protected $appends = ['image_url'];

    public function registerMediaConversions(?\Spatie\MediaLibrary\MediaCollections\Models\Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(600)
            ->height(600)
            ->sharpen(10);
    }

    public function getImageUrlAttribute(): ?string
    {
        // Return thumbnail URL if available, otherwise original
        // If conversion 'thumb' isn't generated yet, it might return empty or logic depending on package config
        // getFirstMediaUrl('images', 'thumb') returns path to thumb.
        $url = $this->getFirstMediaUrl('images', 'thumb');
        if (! $url) {
            $url = $this->getFirstMediaUrl('images');
        }

        return $url ?: null;
    }
}
