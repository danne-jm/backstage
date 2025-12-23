<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EventAttendee extends Model
{
    protected $connection = 'attendees';

    protected $guarded = [];

    // Helper to generate the dynamic table name safely
    public static function generateTableName(Event $event): string
    {
        // Use a slug of the event name and a sensible date fallback
        $slug = Str::slug($event->name, '_');
        $date = 'nodate';

        // Prefer start_date, fall back to event_date if available
        $dateValue = null;
        if (property_exists($event, 'start_date') && $event->start_date) {
            $dateValue = $event->start_date;
        } elseif (property_exists($event, 'event_date') && $event->event_date) {
            $dateValue = $event->event_date;
        }

        if ($dateValue) {
            try {
                $dt = new \DateTime($dateValue);
                $date = $dt->format('Y_m_d');
            } catch (\Throwable $e) {
                $date = 'nodate';
            }
        }

        return strtolower("{$slug}_{$date}_{$event->id}");
    }

    // Helper to get an instance pointing to the correct table
    public static function forEvent(Event $event): self
    {
        $instance = new self;
        $instance->setTable(self::generateTableName($event));

        return $instance;
    }
}
