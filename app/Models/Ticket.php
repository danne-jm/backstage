<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $connection = 'tickets';

    protected $fillable = [
        'event_id',
        'first_name',
        'last_name',
        'email',
        'event_name',
        'event_date',
        'unique_trait',
        'ticket_id',
        'scan_count',
        'scan_details',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'scan_count' => 'integer',
            'scan_details' => 'array',
        ];
    }

    public function setTableForEvent(Event $event): self
    {
        $tableName = $this->generateTableName($event);
        $this->setTable($tableName);

        return $this;
    }

    public static function forEvent(Event $event): self
    {
        return (new static())->setTableForEvent($event);
    }

    public static function generateTableName(Event $event): string
    {
        $name = preg_replace('/[^a-zA-Z0-9_]/', '_', $event->name);
        $date = $event->event_date ? $event->event_date->format('Y_m_d') : 'no_date';

        return strtolower("{$name}_{$date}_{$event->id}");
    }
}
