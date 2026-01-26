<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Event extends Model
{
    use HasFactory, LogsActivity, \Illuminate\Database\Eloquent\Concerns\HasUlids;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['*'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'name',
        'description',
        'event_date',
        'start_sell_date',
        'end_sell_date',
        'price_with_card',
        'price_without_card',
        'quantity',
        'unlimited_quantity',
        'responsible_user_id',
        'notes',
        'variable_amount',
        'quantity_with_card',
        'unlimited_quantity_with_card',
        'quantity_without_card',
        'unlimited_quantity_without_card',
        'google_spreadsheet_id',
        'google_sheet_name',
        'is_online_sellable',
        'attendee_filter_config',
        'instagram_link',
    ];

    protected $appends = ['remaining', 'remaining_with_card', 'remaining_without_card', 'image', 'images_list'];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'start_sell_date' => 'date',
            'end_sell_date' => 'date',
            'variable_amount' => 'boolean',
            'price_with_card' => 'decimal:2',
            'price_without_card' => 'decimal:2',
            'unlimited_quantity' => 'boolean',
            'unlimited_quantity_with_card' => 'boolean',
            'unlimited_quantity_without_card' => 'boolean',
            'attendee_filter_config' => 'array',
        ];
    }

    public function responsibleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function attendees()
    {
        return $this->hasMany(Attendee::class);
    }

    public function sales()
    {
        return $this->hasMany(OfficeShiftSale::class);
    }

    public function onlineSales()
    {
        return $this->hasMany(OnlineSale::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(EventImage::class);
    }

    /**
     * Ensure event_date is always serialized as YYYY-MM-DD (date only).
     */
    public function getEventDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getStartSellDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getEndSellDateAttribute($value): ?string
    {
        if (! $value) {
            return null;
        }

        return \Illuminate\Support\Carbon::parse($value)->format('Y-m-d');
    }

    public function getSalesWithCardCountAttribute()
    {
        $officeSales = array_key_exists('sales_with_card_count', $this->attributes) ? $this->attributes['sales_with_card_count'] : $this->sales()->where('snapshot->ticket_type', 'with_card')->count();
        $onlineSales = array_key_exists('online_sales_with_card_count', $this->attributes) ? $this->attributes['online_sales_with_card_count'] : $this->onlineSales()->where('details->ticket_type', 'with_card')->count();

        return $officeSales + $onlineSales;
    }

    public function getSalesWithoutCardCountAttribute()
    {
        $officeSales = array_key_exists('sales_without_card_count', $this->attributes) ? $this->attributes['sales_without_card_count'] : $this->sales()->where('snapshot->ticket_type', 'without_card')->count();
        $onlineSales = array_key_exists('online_sales_without_card_count', $this->attributes) ? $this->attributes['online_sales_without_card_count'] : $this->onlineSales()->where('details->ticket_type', 'without_card')->count();

        return $officeSales + $onlineSales;
    }

    public function getRemainingWithCardAttribute()
    {
        // Return null when unlimited or quantity is not set so the frontend can show "Unlimited"
        if ($this->unlimited_quantity_with_card) {
            return null;
        }
        if (is_null($this->quantity_with_card)) {
            return null;
        }

        // SECURITY FIX: Use atomic sold_count column instead of count query to prevent snapshot isolation issues
        return max(0, $this->quantity_with_card - ($this->sold_count_with_card ?? 0));
    }

    public function getRemainingWithoutCardAttribute()
    {
        if ($this->unlimited_quantity_without_card) {
            return null;
        }
        if (is_null($this->quantity_without_card)) {
            return null;
        }

        // SECURITY FIX: Use atomic sold_count column instead of count query
        return max(0, $this->quantity_without_card - ($this->sold_count_without_card ?? 0));
    }

    public function getRemainingAttribute()
    {
        if ($this->unlimited_quantity) {
            return null;
        }
        if (is_null($this->quantity)) {
            return null;
        }

        if (array_key_exists('sales_count', $this->attributes) && array_key_exists('online_sales_count', $this->attributes)) {
            return max(0, $this->quantity - $this->attributes['sales_count'] - $this->attributes['online_sales_count']);
        }

        return max(0, $this->quantity - $this->sales()->count() - $this->onlineSales()->count());
    }

    public function getImageAttribute(): ?string
    {
        // Only select id to avoid loading binary data
        $firstImage = $this->images()->select('id', 'event_id')->first();

        return $firstImage ? "/events/images/{$firstImage->id}" : null;
    }

    public function getImagesListAttribute(): array
    {
        // Only select id to avoid loading binary data
        return $this->images()->select('id', 'event_id')->get()->map(function ($img) {
            return [
                'id' => $img->id,
                'url' => "/events/images/{$img->id}",
            ];
        })->toArray();
    }

    public function filterRows(array $rows): array
    {
        $filterConfig = $this->attendee_filter_config;

        if (! $filterConfig || ! is_array($filterConfig) || count($rows) <= 1) {
            return $rows;
        }

        $headers = array_map('trim', $rows[0]); // Normalize headers
        $filteredRows = [$rows[0]]; // Keep header

        // Slice to get data rows
        $dataRows = array_slice($rows, 1);

        foreach ($dataRows as $row) {
            $match = true;
            foreach ($filterConfig as $rule) {
                $column = $rule['column'] ?? null;
                $operator = $rule['operator'] ?? null;
                $value = $rule['value'] ?? null;

                if (! $column || ! $operator) {
                    continue;
                }

                $columnIndex = array_search($column, $headers);
                if ($columnIndex === false) {
                    continue;
                }

                $cellValue = isset($row[$columnIndex]) ? trim($row[$columnIndex]) : '';

                switch ($operator) {
                    case 'equals':
                        if (strcasecmp($cellValue, $value) !== 0) {
                            $match = false;
                        }
                        break;
                    case 'contains':
                        if (stripos($cellValue, $value) === false) {
                            $match = false;
                        }
                        break;
                    case 'not_contains':
                        if (stripos($cellValue, $value) !== false) {
                            $match = false;
                        }
                        break;
                    case 'is_checked':
                        $isChecked = strtoupper($cellValue) === 'TRUE';
                        if (! $isChecked) {
                            $match = false;
                        }
                        break;
                    case 'is_not_checked':
                        $isChecked = strtoupper($cellValue) === 'TRUE';
                        if ($isChecked) {
                            $match = false;
                        }
                        break;
                    case 'is_empty':
                        if ($cellValue !== '') {
                            $match = false;
                        }
                        break;
                    case 'is_not_empty':
                        if ($cellValue === '') {
                            $match = false;
                        }
                        break;
                }

                if (! $match) {
                    break;
                }
            }

            if ($match) {
                $filteredRows[] = $row;
            }
        }

        return array_values($filteredRows);
    }
}
