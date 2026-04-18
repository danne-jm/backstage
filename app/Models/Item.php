<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Item extends Model implements HasMedia
{
    use HasFactory, HasUlids, InteractsWithMedia, \Spatie\Activitylog\Traits\LogsActivity;

    public function getActivitylogOptions(): \Spatie\Activitylog\LogOptions
    {
        return \Spatie\Activitylog\LogOptions::defaults()
            ->logOnly(['name', 'quantity', 'category'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('inventory');
    }

    protected $table = 'items';

    protected $fillable = [
        'name',
        'quantity',
        'category',
        'last_modified',
        'changed_by',
    ];

    protected $casts = [
        'category'      => 'array',
        'last_modified' => 'datetime',
    ];

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
        $url = $this->getFirstMediaUrl('images', 'thumb');

        if (! $url) {
            $url = $this->getFirstMediaUrl('images');
        }

        return $url ?: null;
    }
}
