<?php

namespace App\Models;

use App\Models\Concerns\HasSellableStock;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

abstract class Sellable extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, HasSellableStock, HasUlids, \Spatie\Activitylog\Traits\LogsActivity;

    public function getActivitylogOptions(): \Spatie\Activitylog\LogOptions
    {
        return \Spatie\Activitylog\LogOptions::defaults()
            ->logOnly(['name', 'description', 'quantity', 'unlimited_quantity', 'is_online_sellable'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->useLogName('sellables');
    }

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
        'hide_until_sale',
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
        'hide_until_sale' => 'boolean',
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
            ->format('webp')
            ->quality(100)
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

    /**
     * Whether the main entity has any stock available.
     * Events override this with ticket-type-specific logic.
     */
    public function checkHasStock(): bool
    {
        return (bool) $this->unlimited_quantity
            || is_null($this->quantity)
            || ($this->quantity - $this->computedSoldCount()) > 0;
    }

    /**
     * Compute sold count from actual sale records.
     * Subclasses override this with their specific query logic.
     */
    public function computedSoldCount(): int
    {
        return 0;
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