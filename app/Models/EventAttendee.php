<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventAttendee extends Model
{
    protected $connection = 'attendees';

    protected $fillable = [
        'first_name',
        'last_name',
        'nationality',
        'esn_card',
        'email',
    ];

    protected function casts(): array
    {
        return [
            'esn_card' => 'boolean',
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
