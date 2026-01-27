<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
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
        return Inertia::render('Backstage/ticket-scanner', [
            'events' => $events,
            'tickets' => [],
        ]);
    }

    public function import(Request $request)
    {
        $data = $request->validate([
            'event_id' => 'required|string',
            'samples' => 'required|array',
        ]);

        $ev = Event::find($data['event_id']);
        if (! $ev) {
            return response()->json(['error' => 'Event not found'], 404);
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

            $ticketCode = sprintf('%s_%s_to_%s_via_%s_%s',
                $sanitizedEvent,
                $datePart,
                $sanitizedFullName,
                $sanitizedEmail,
                $unique
            );

            $ticket = $ev->tickets()->create([
                'user_id' => null,
                'ticket_code' => $ticketCode,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'metadata' => [
                    'first_name' => $first,
                    'last_name' => $last,
                    'email' => $email,
                    'event_name' => $eventName,
                    'event_date' => $eventDate,
                ],
                'scanned_at' => null,
            ]);

            // Dispatch realtime event for ticket scanner listeners
            \App\Events\TicketSold::dispatch($ev->id, $ticket);

            // Clear available tickets cache
            \Illuminate\Support\Facades\Cache::forget("available_tickets_{$ev->id}");

            $created[] = [
                'ticket_code' => $ticketCode,
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

        // Get tickets with scanned_at = null for the selected event
        // Cache this for 10 seconds to prevent stampede during entry
        $tickets = \Illuminate\Support\Facades\Cache::remember("available_tickets_{$eventId}", 10, function () use ($event) {
            return $event->tickets()->whereNull('scanned_at')->orderBy('created_at', 'desc')->get();
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

        // Get tickets with scanned_at not null for the selected event
        $tickets = $event->tickets()->whereNotNull('scanned_at')->orderBy('updated_at', 'desc')->get();

        return response()->json(['tickets' => $tickets]);
    }

    public function verify(Request $request)
    {
        $id = $request->input('ticket_id');
        $eventId = $request->input('event_id');

        if (! $id || ! $eventId) {
            return response()->json(['valid' => false, 'error' => 'Missing ticket_id or event_id'], 400);
        }

        $event = Event::find($eventId);
        if (! $event) {
            return response()->json(['valid' => false, 'error' => 'Event not found'], 404);
        }

        // Global lookup first to provide better error messages
        $ticket = \App\Models\Ticket::where('ticket_code', $id)->first();

        if (! $ticket) {
            return response()->json(['valid' => false, 'error' => 'Invalid ticket code'], 404);
        }

        // Check if ticket belongs to the selected event
        if ($ticket->event_id != $eventId) {
            $ticketEventName = $ticket->event ? $ticket->event->name : 'another event';
            return response()->json([
                'valid' => false,
                'error' => "Ticket is for '{$ticketEventName}', not the selected event."
            ], 400);
        }

        // SECURITY FIX: Use atomic update to prevent race condition where two concurrent
        // requests could both mark the same ticket as scanned.
        // This atomically updates scanned_at ONLY if it was previously null.
        $affectedRows = \App\Models\Ticket::where('id', $ticket->id)
            ->whereNull('scanned_at')
            ->update([
                'scanned_at' => now(),
                'scan_count' => \DB::raw('COALESCE(scan_count, 0) + 1'),
            ]);

        if ($affectedRows > 0) {
            // First scan - successful
            $ticket->refresh(); // getting fresh data

            // Append scan details (separate update to handle JSON field)
            $scanDetails = $ticket->scan_details ?? [];
            $scanDetails[] = [
                'timestamp' => now()->toDateTimeString(),
                'user_id' => auth()->id(),
                'user_email' => auth()->user()?->email,
            ];
            $ticket->scan_details = $scanDetails;
            $ticket->save();

            // Clear cache and broadcast event
            \Illuminate\Support\Facades\Cache::forget("available_tickets_{$eventId}");
            \App\Events\TicketScanned::dispatch($eventId, $ticket);

            return response()->json([
                'valid' => true,
                'ticket' => $ticket,
                'previously_scanned' => false,
                'previous_scan_count' => 0,
            ]);
        }

        // Already scanned - increment scan_count and log the attempt
        $previousScanCount = $ticket->scan_count ?? 0;

        // Manually increment since update failed (it means scanned_at was not null)
        $ticket->scan_count = $previousScanCount + 1;
        $scanDetails = $ticket->scan_details ?? [];
        $scanDetails[] = [
            'timestamp' => now()->toDateTimeString(),
            'user_id' => auth()->id(),
            'user_email' => auth()->user()?->email,
        ];
        $ticket->scan_details = $scanDetails;
        $ticket->save();

        // Broadcast update even for duplicate scans (to update logs/counts on other devices)
        \App\Events\TicketScanned::dispatch($eventId, $ticket);

        return response()->json([
            'valid' => true,
            'ticket' => $ticket,
            'previously_scanned' => true,
            'previous_scan_count' => $previousScanCount,
        ]);
    }
}
