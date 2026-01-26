<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    use \Illuminate\Database\Eloquent\Concerns\HasUlids;

    protected $fillable = [
        'product_id',
        'image_data',
        'mime_type',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
