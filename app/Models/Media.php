<?php

namespace App\Models;

use Spatie\MediaLibrary\MediaCollections\Models\Media as BaseMedia;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class Media extends BaseMedia
{
    use HasUlids;
}
