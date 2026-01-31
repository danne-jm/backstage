<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Ticket;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EventTicketsSeeder extends Seeder
{
    public function run(): void
    {
        // Find an event to tie tickets to
        $event = Event::where('name', 'Welcome Weekend Trip')->first();

        if (! $event) {
            $event = Event::first();
        }

        if (! $event) {
            return;
        }

        $samples = [
            ['first_name' => 'Alice', 'last_name' => 'Meyer', 'email' => 'alice.meyer@example.com'],
            ['first_name' => 'Bob', 'last_name' => 'Smith', 'email' => 'bob.smith@gmail.com'],
            ['first_name' => 'Carlos', 'last_name' => 'Garcia', 'email' => 'carlos.garcia@esnleuven.be'],
        ];

        foreach ($samples as $row) {
            $unique = Str::random(8);
            $eventName = $event->name;
            $eventDate = $event->event_date;

            $datePart = $eventDate ? \Illuminate\Support\Carbon::parse($eventDate)->format('d-m-Y') : 'nodate';

            $sanitizedEvent = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $eventName);
            $sanitizedFirst = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $row['first_name']);
            $sanitizedLast = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $row['last_name']);
            $sanitizedFullName = trim($sanitizedFirst.'-'.$sanitizedLast, '-');
            $sanitizedEmail = preg_replace('/[^A-Za-z0-9@._\-]+/', '', (string) $row['email']);

            $ticketCode = sprintf('%s_%s_to_%s_via_%s_%s',
                $sanitizedEvent,
                $datePart,
                $sanitizedFullName,
                $sanitizedEmail,
                $unique
            );

            Ticket::create([
                'id' => Str::ulid(),
                'event_id' => $event->id,
                'ticket_code' => $ticketCode,
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'email' => $row['email'],
                'metadata' => [
                    'first_name' => $row['first_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'event_name' => $eventName,
                    'event_date' => $eventDate,
                ],
                'unique_trait' => $unique,
            ]);
        }
    }
}
