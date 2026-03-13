<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

abstract class Sellable extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $commonFillable = [
        'name',
        'description',
        'variants_config',
        'is_variant_based',
        'quantity',
        'unlimited_quantity',
        'variable_amount',
        'quantity_with_card',
        'unlimited_quantity_with_card',
        'quantity_without_card',
        'unlimited_quantity_without_card',
        'is_online_sellable',
        'instagram_link'
    ];

    protected $commonCasts = [
        'variants_config' => 'array',
        'is_variant_based' => 'boolean',
        'quantity' => 'integer',
        'unlimited_quantity' => 'boolean',
        'variable_amount' => 'boolean',
        'quantity_with_card' => 'integer',
        'unlimited_quantity_with_card' => 'boolean',
        'quantity_without_card' => 'integer',
        'unlimited_quantity_without_card' => 'boolean',
        'is_online_sellable' => 'boolean',
    ];

    protected $commonAppends = ['image', 'images_list'];

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        $this->fillable = array_merge($this->commonFillable, $this->fillable);
        $this->casts = array_merge($this->commonCasts, $this->casts);
        $this->appends = array_merge($this->commonAppends, $this->appends);
    }

    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('optimized')
            ->width(1200)
            ->height(1200)
            ->format('webp')
            ->nonQueued();
    }

    public function getImageAttribute(): ?string
    {
        if (!$this->hasMedia('images')) {
            return null;
        }

        $media = $this->getFirstMedia('images');
        return $media->hasGeneratedConversion('optimized') ? $media->getUrl('optimized') : $media->getUrl();
    }

    public function getImagesListAttribute(): array
    {
        return $this->getMedia('images')->map(function ($media) {
            return [
                'id' => $media->id,
                'url' => $media->hasGeneratedConversion('optimized') ? $media->getUrl('optimized') : $media->getUrl(),
            ];
        })->toArray();
    }

    public function variants()
    {
        return $this->morphMany(SellableVariant::class, 'sellable');
    }

    public function sales()
    {
        return $this->hasMany(OfficeShiftSale::class);
    }

    public function onlineSales()
    {
        return $this->hasMany(OnlineSale::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'event_id');
    }
}