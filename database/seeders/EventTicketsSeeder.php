<?php

namespace Database\Seeders;

use App\Models\EventTicket;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EventTicketsSeeder extends Seeder
{
    public function run(): void
    {
        // Create a few sample tickets tied to event id 2 (Welcome Weekend Trip)
        $samples = [
            ['first_name' => 'Alice', 'last_name' => 'Meyer', 'email' => 'alice.meyer@example.com'],
            ['first_name' => 'Bob', 'last_name' => 'Smith', 'email' => 'bob.smith@gmail.com'],
            ['first_name' => 'Carlos', 'last_name' => 'Garcia', 'email' => 'carlos.garcia@esnleuven.be'],
        ];

        foreach ($samples as $row) {
            $unique = Str::random(8);
            $eventName = 'Welcome Weekend Trip';
            $eventDate = now()->addDays(1)->format('Y-m-d H:i:s');
            $datePart = (new \DateTime($eventDate))->format('YmdHis');
            $sanitizedName = preg_replace('/[^A-Za-z0-9_]+/', '_', $eventName);
            $sanitizedFirst = preg_replace('/[^A-Za-z0-9_]+/', '_', $row['first_name']);
            $sanitizedLast = preg_replace('/[^A-Za-z0-9_]+/', '_', $row['last_name']);
            $ticketId = trim(sprintf('%s_%s_%s_%s_%s', $sanitizedName, $datePart, $sanitizedFirst, $sanitizedLast, $unique), '_');

            EventTicket::firstOrCreate([
                'ticket_id' => $ticketId,
            ], [
                'event_id' => 2,
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'email' => $row['email'],
                'event_name' => $eventName,
                'event_date' => $eventDate,
                'unique_trait' => $unique,
            ]);
        }
    }
}
