<?php

namespace App\Services;

use App\Events\TicketScanned;
use App\Events\TicketSold;
use App\Models\sellables\Event;
use App\Models\Ticket;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TicketScannerService
{
    /**
     * Get all events that can be scanned (ordered by date)
     */
    public function getEvents()
    {
        // Assuming we want active events or generally all events for scanner list
        return Event::query()->orderBy('start_sell_date')->get();
    }

    /**
     * Get available tickets (not scanned) for a specific event
     */
    public function getAvailableTickets(string $eventId)
    {
        // Cache this for 10 seconds to prevent stampede during entry
        return Cache::remember("available_tickets_{$eventId}", 10, function () use ($eventId) {
            return Ticket::where('event_id', $eventId)
                ->whereNull('scanned_at')
                ->orderBy('created_at', 'desc')
                ->get();
        });
    }

    /**
     * Get scanned tickets for a specific event
     */
    public function getScannedTickets(string $eventId)
    {
        return Ticket::where('event_id', $eventId)
            ->whereNotNull('scanned_at')
            ->orderBy('updated_at', 'desc')
            ->get();
    }

    /**
     * Verify a ticket code for an event
     */
    public function verifyTicket(string $ticketCode, string $eventId, ?string $userId = null, ?string $userEmail = null)
    {
        // Global lookup first to provide better error messages
        $ticket = Ticket::where('ticket_code', $ticketCode)->first();

        if (! $ticket) {
            return ['valid' => false, 'error' => 'Invalid ticket code', 'code' => 404];
        }

        // Check if ticket belongs to the selected event
        if ($ticket->event_id != $eventId) {
            $ticketEventName = $ticket->event ? $ticket->event->name : 'another event';

            return [
                'valid' => false,
                'error' => "Ticket is for '{$ticketEventName}', not the selected event.",
                'code' => 400
            ];
        }

        // Atomic update to prevent race condition
        $affectedRows = Ticket::where('id', $ticket->id)
            ->whereNull('scanned_at')
            ->update([
                'scanned_at' => now(),
                'scan_count' => DB::raw('COALESCE(scan_count, 0) + 1'),
            ]);

        $scanInfo = [
            'timestamp' => now()->toDateTimeString(),
            'user_id' => $userId,
            'user_email' => $userEmail,
        ];

        if ($affectedRows > 0) {
            // First scan - successful
            $ticket->refresh();

            // Append scan details
            $scanDetails = $ticket->scan_details ?? [];
            $scanDetails[] = $scanInfo;
            $ticket->scan_details = $scanDetails;
            $ticket->save();

            // Clear cache and broadcast
            Cache::forget("available_tickets_{$eventId}");
            TicketScanned::dispatch($eventId, $ticket);

            return [
                'valid' => true,
                'ticket' => $ticket,
                'previously_scanned' => false,
                'previous_scan_count' => 0,
            ];
        }

        // Already scanned - increment scan_count and log the attempt
        $ticket->refresh();
        $previousScanCount = $ticket->scan_count ?? 0;

        // Manually increment since update failed (it means scanned_at was not null)
        $ticket->scan_count = $previousScanCount + 1;
        $scanDetails = $ticket->scan_details ?? [];
        $scanDetails[] = $scanInfo;
        $ticket->scan_details = $scanDetails;
        $ticket->save();

        // Broadcast update even for duplicate scans
        TicketScanned::dispatch($eventId, $ticket);

        return [
            'valid' => true,
            'ticket' => $ticket,
            'previously_scanned' => true,
            'previous_scan_count' => $previousScanCount,
        ];
    }

    /**
     * Import tickets from samples
     */
    public function importTickets(string $eventId, array $samples)
    {
        $ev = Event::find($eventId);
        if (! $ev) {
            return ['error' => 'Event not found'];
        }

        $created = [];
        foreach ($samples as $row) {
            $first = isset($row['first_name']) ? (string) $row['first_name'] : '';
            $last = isset($row['last_name']) ? (string) $row['last_name'] : '';
            $email = isset($row['email']) ? (string) $row['email'] : '';

            $unique = Str::random(8);

            $eventName = $ev->name;
            $eventDate = $ev->event_date;

            $datePart = 'nodate';
            if ($eventDate) {
                try {
                    // event_date might be string or Carbon depending on accessor
                    // Assuming string in keeping with safety, or Carbon if cast works
                    if ($eventDate instanceof \DateTimeInterface) {
                         $datePart = $eventDate->format('d-m-Y');
                    } else {
                         try {
                              $datePart = \Carbon\Carbon::parse($eventDate)->format('d-m-Y');
                         } catch (\Throwable $e) {
                              $datePart = str_replace([' ', ':', '-'], '', (string) $eventDate);
                         }
                    }
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
            TicketSold::dispatch($ev->id, $ticket);

            // Clear available tickets cache
            Cache::forget("available_tickets_{$ev->id}");

            $created[] = [
                'ticket_code' => $ticketCode,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
            ];
        }

        return ['created' => $created];
    }
}
