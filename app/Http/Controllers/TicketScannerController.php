<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TicketScannerController extends Controller
{
    public function index()
    {
        $events = [];
        try {
            $events = Event::query()->orderBy('start_sell_date')->get();
        } catch (\Throwable $e) {
            $events = [];
        }

        // Don't load tickets initially - they'll be loaded per event
        return Inertia::render('ticket-scanner', [
            'events' => $events,
            'tickets' => [],
        ]);
    }

    public function import(Request $request)
    {
        $data = $request->validate([
            'event_id' => 'required|integer',
            'samples' => 'required|array',
        ]);

        $ev = Event::find($data['event_id']);
        if (! $ev) {
            return response()->json(['error' => 'Event not found'], 404);
        }

        $tableName = Ticket::generateTableName($ev);

        // Create table if it doesn't exist
        if (! Schema::connection('tickets')->hasTable($tableName)) {
            Schema::connection('tickets')->create($tableName, function ($table) {
                $table->id();
                $table->unsignedBigInteger('event_id')->nullable();
                $table->string('first_name')->nullable();
                $table->string('last_name')->nullable();
                $table->string('email')->nullable();
                $table->string('event_name')->nullable();
                $table->dateTime('event_date')->nullable();
                $table->string('unique_trait')->nullable();
                $table->string('ticket_id')->unique();
                $table->unsignedInteger('scan_count')->default(0);
                $table->json('scan_details')->nullable();
                $table->timestamps();

                $table->index(['event_id']);
                $table->index(['ticket_id']);
            });
        }

        $created = [];
        foreach ($data['samples'] as $row) {
            $first = isset($row['first_name']) ? (string) $row['first_name'] : '';
            $last = isset($row['last_name']) ? (string) $row['last_name'] : '';
            $email = isset($row['email']) ? (string) $row['email'] : '';

            $unique = Str::random(8);

            $eventName = $ev->name;
            $eventDate = $ev->event_date;

            $datePart = 'nodate';
            if ($eventDate) {
                try {
                    $datePart = $eventDate->format('d-m-Y');
                } catch (\Throwable $e) {
                    $datePart = str_replace([' ', ':', '-'], '', (string) $eventDate);
                }
            }

            // Sanitize for new format: dashes for event and names
            $sanitizedEvent = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $eventName);
            $sanitizedFirst = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $first);
            $sanitizedLast = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $last);
            $sanitizedFullName = trim($sanitizedFirst.'-'.$sanitizedLast, '-');
            $sanitizedEmail = preg_replace('/[^A-Za-z0-9@._\-]+/', '', (string) $email);

            $ticketId = sprintf('%s_%s_to_%s_via_%s_%s',
                $sanitizedEvent,
                $datePart,
                $sanitizedFullName,
                $sanitizedEmail,
                $unique
            );

            DB::connection('tickets')->table($tableName)->insert([
                'event_id' => $ev->id,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'event_name' => $eventName,
                'event_date' => $eventDate,
                'unique_trait' => $unique,
                'ticket_id' => $ticketId,
                'scan_count' => 0,
                'scan_details' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $created[] = [
                'ticket_id' => $ticketId,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
            ];
        }

        return response()->json(['created' => $created], 201);
    }

    public function availableTickets(Request $request)
    {
        $eventId = $request->query('event_id');
        if (! $eventId) {
            return response()->json(['tickets' => []]);
        }

        $event = Event::find($eventId);
        if (! $event) {
            return response()->json(['tickets' => []]);
        }

        $tableName = Ticket::generateTableName($event);

        if (! Schema::connection('tickets')->hasTable($tableName)) {
            return response()->json(['tickets' => []]);
        }

        // Get tickets with scan_count = 0 for the selected event
        $tickets = DB::connection('tickets')
            ->table($tableName)
            ->where('scan_count', 0)
            ->orderBy('created_at', 'desc')
            ->get();

        // Ensure scan_details is decoded to an array for the JSON response
        $tickets = $tickets->map(function ($t) {
            $t = (array) $t;
            if (isset($t['scan_details']) && $t['scan_details'] !== null) {
                $decoded = json_decode($t['scan_details'], true);
                $t['scan_details'] = is_array($decoded) ? $decoded : [];
            } else {
                $t['scan_details'] = [];
            }

            return $t;
        });

        return response()->json(['tickets' => $tickets]);
    }

    public function scannedTickets(Request $request)
    {
        $eventId = $request->query('event_id');
        if (! $eventId) {
            return response()->json(['tickets' => []]);
        }

        $event = Event::find($eventId);
        if (! $event) {
            return response()->json(['tickets' => []]);
        }

        $tableName = Ticket::generateTableName($event);

        if (! Schema::connection('tickets')->hasTable($tableName)) {
            return response()->json(['tickets' => []]);
        }

        // Get tickets with scan_count > 0 for the selected event
        $tickets = DB::connection('tickets')
            ->table($tableName)
            ->where('scan_count', '>', 0)
            ->orderBy('updated_at', 'desc')
            ->get();

        // Ensure scan_details is decoded to an array for the JSON response
        $tickets = $tickets->map(function ($t) {
            $t = (array) $t;
            if (isset($t['scan_details']) && $t['scan_details'] !== null) {
                $decoded = json_decode($t['scan_details'], true);
                $t['scan_details'] = is_array($decoded) ? $decoded : [];
            } else {
                $t['scan_details'] = [];
            }

            return $t;
        });

        return response()->json(['tickets' => $tickets]);
    }

    public function verify(Request $request)
    {
        $id = $request->query('ticket_id');
        $eventId = $request->query('event_id');

        if (! $id || ! $eventId) {
            return response()->json(['valid' => false], 400);
        }

        $event = Event::find($eventId);
        if (! $event) {
            return response()->json(['valid' => false], 404);
        }

        $tableName = Ticket::generateTableName($event);

        if (! Schema::connection('tickets')->hasTable($tableName)) {
            return response()->json(['valid' => false], 404);
        }

        $ticket = DB::connection('tickets')
            ->table($tableName)
            ->where('ticket_id', $id)
            ->first();

        if (! $ticket) {
            return response()->json(['valid' => false], 404);
        }

        // Record that a verification happened: return previous scan_count to the client
        $previous = (int) ($ticket->scan_count ?? 0);

        // append scan detail (timestamp + user email)
        $details = json_decode($ticket->scan_details ?? '[]', true);
        if (! is_array($details)) {
            $details = [];
        }
        $details[] = [
            'at' => now()->toDateTimeString(),
            'user_email' => $request->user() ? $request->user()->email : null,
        ];

        // increment scan_count and save details
        DB::connection('tickets')->table($tableName)
            ->where('ticket_id', $id)
            ->update([
                'scan_count' => $previous + 1,
                'scan_details' => json_encode($details),
                'updated_at' => now(),
            ]);

        // Fetch updated ticket and decode scan_details for JSON response
        $updatedTicket = DB::connection('tickets')
            ->table($tableName)
            ->where('ticket_id', $id)
            ->first();

        if ($updatedTicket) {
            $ut = (array) $updatedTicket;
            if (isset($ut['scan_details']) && $ut['scan_details'] !== null) {
                $decoded = json_decode($ut['scan_details'], true);
                $ut['scan_details'] = is_array($decoded) ? $decoded : [];
            } else {
                $ut['scan_details'] = [];
            }
            $updatedTicket = $ut;
        }

        return response()->json(['valid' => true, 'ticket' => $updatedTicket, 'previous_scan_count' => $previous]);
    }
}
