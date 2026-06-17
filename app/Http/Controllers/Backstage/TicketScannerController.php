<?php

namespace App\Http\Controllers\Backstage;

use App\Actions\Tickets\ProvisionTicketForEmailAction;
use App\Actions\Tickets\ScanTicketAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\ImportTicketsRequest;
use App\Http\Requests\Backstage\ScanTicketRequest;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TicketScannerController extends Controller
{
    /**
     * Display the ticket scanner interface, scoped to a specific event.
     */
    public function index(Event $event): Response
    {
        return Inertia::render('backstage/ticket-scanner/index', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'event_date' => $event->event_date?->toIso8601String(),
            ],
            'stats' => Inertia::defer(fn () => [
                'total_tickets' => Ticket::where('event_id', $event->id)->count(),
                'scanned_count' => Ticket::where('event_id', $event->id)->where('scan_count', '>', 0)->count(),
                'not_scanned_count' => Ticket::where('event_id', $event->id)->where('scan_count', 0)->count(),
            ]),
        ]);
    }

    /**
     * Process a QR code scan. Returns JSON for real-time scanner feedback.
     * Uses pessimistic locking via ScanTicketAction to prevent double-scans.
     */
    public function scan(ScanTicketRequest $request, Event $event, ScanTicketAction $action): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $result = $action->handle(
            ticketCode: $request->string('ticket_code')->toString(),
            eventId: $event->id,
            scannerUser: $user,
        );

        return response()->json([
            'success' => $result->success,
            'message' => $result->message,
            'ticket' => $result->ticket ? [
                'id' => $result->ticket->id,
                'ticket_code' => $result->ticket->ticket_code,
                'first_name' => $result->ticket->first_name,
                'last_name' => $result->ticket->last_name,
                'email' => $result->ticket->email,
                'scan_count' => $result->ticket->scan_count,
                'scanned_at' => $result->ticket->scanned_at?->toIso8601String(),
            ] : null,
        ], $result->success ? 200 : 422);
    }

    /**
     * Bulk-import tickets via a CSV file. Each row should be:
     * email, first_name, last_name
     *
     * A ticket record and QR code will be provisioned for each row.
     */
    public function import(ImportTicketsRequest $request, Event $event, ProvisionTicketForEmailAction $action): RedirectResponse
    {
        $file = $request->file('csv_file');
        $handle = fopen($file->getPathname(), 'r');

        // Skip the header row
        fgetcsv($handle);

        $importedCount = 0;
        $errors = [];

        DB::transaction(function () use ($handle, $event, $action, &$importedCount, &$errors) {
            while (($row = fgetcsv($handle)) !== false) {
                [$email, $firstName, $lastName] = array_pad($row, 3, null);

                if (empty(trim($email ?? ''))) {
                    continue;
                }

                // Idempotent: skip if a ticket for this email/event already exists
                $alreadyExists = Ticket::where('event_id', $event->id)
                    ->where('email', trim($email))
                    ->exists();

                if ($alreadyExists) {
                    $errors[] = "Skipped duplicate: {$email}";

                    continue;
                }

                $action->handle(
                    event: $event,
                    email: trim($email),
                    firstName: $firstName ? trim($firstName) : null,
                    lastName: $lastName ? trim($lastName) : null,
                );

                $importedCount++;
            }
        });

        fclose($handle);

        $message = "Imported {$importedCount} ticket(s) successfully.";
        if (! empty($errors)) {
            $message .= ' '.count($errors).' row(s) skipped (duplicates).';
        }

        return back()->with('success', $message);
    }
}
