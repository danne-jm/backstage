<?php

namespace App\Actions\Tickets;

use App\DTOs\Tickets\ScanResultPayload;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ScanTicketAction
{
    /**
     * Attempts to scan a ticket for a specific event.
     * Uses pessimistic locking to prevent race conditions (double-scanning).
     */
    public function handle(string $ticketCode, string $eventId, User $scannerUser): ScanResultPayload
    {
        return DB::transaction(function () use ($ticketCode, $eventId, $scannerUser) {
            // 1. Find and lock the ticket to prevent concurrent double-scans
            $ticket = Ticket::where('ticket_code', $ticketCode)
                ->where('event_id', $eventId)
                ->lockForUpdate()
                ->first();

            // 2. Validate ticket exists for this specific event
            if (! $ticket) {
                return new ScanResultPayload(
                    success: false,
                    message: 'Invalid Ticket: Not found for this event.'
                );
            }

            // 3. Check if already scanned (Assuming 1 scan allowed per ticket for now)
            if ($ticket->scan_count >= 1) {
                return new ScanResultPayload(
                    success: false,
                    message: "Warning: Ticket already scanned at {$ticket->scanned_at->format('H:i')}.",
                    ticket: $ticket
                );
            }

            // 4. Update scan metrics
            $scanDetails = $ticket->scan_details ?? [];
            $scanDetails[] = [
                'scanned_at' => now()->toIso8601String(),
                'scanner_id' => $scannerUser->id,
                'scanner_name' => $scannerUser->first_name.' '.$scannerUser->last_name,
            ];

            $ticket->update([
                'scan_count' => $ticket->scan_count + 1,
                'scan_details' => $scanDetails,
                'scanned_at' => now(),
            ]);

            // 5. Fire WebSocket Broadcasting Event (Optional)
            // broadcast(new \App\Events\TicketScanned($ticket))->toOthers();

            return new ScanResultPayload(
                success: true,
                message: 'Ticket Valid & Successfully Scanned!',
                ticket: $ticket
            );
        });
    }
}
