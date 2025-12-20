<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OfficeShiftWorker extends Model
{
    use HasFactory;

    protected $fillable = ['office_shift_id', 'user_id', 'role'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
