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
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TicketScannerController extends Controller
{
    /**
     * Display the ticket scanner interface, scoped to a specific event.
     */
    public function index(Request $request): Response
    {
        $availableEvents = Event::whereIn('id', Ticket::select('event_id')->distinct())
            ->orderByDesc('event_date')
            ->get(['id', 'name', 'event_date'])
            ->map(function (Event $e): array {
                return [
                    'id' => $e->id,
                    'name' => $e->name,
                    'event_date' => $e->event_date ? Carbon::parse($e->event_date)->toIso8601String() : null,
                ];
            })->all();

        $eventId = (string) $request->query('event_id');
        $event = $eventId ? Event::where('id', $eventId)->first() : null;

        $tickets = [];
        if ($event) {
            $tickets = Ticket::where('event_id', $event->id)
                ->orderBy('first_name')
                ->get(['id', 'ticket_code', 'first_name', 'last_name', 'email', 'scan_count', 'scanned_at'])
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'ticket_code' => $t->ticket_code,
                    'first_name' => $t->first_name,
                    'last_name' => $t->last_name,
                    'email' => $t->email,
                    'scan_count' => $t->scan_count,
                    'scanned_at' => $t->scanned_at?->toIso8601String(),
                ]);
        }

        return Inertia::render('backstage/ticket-scanner/index', [
            'availableEvents' => $availableEvents,
            'event' => $event ? [
                'id' => $event->id,
                'name' => $event->name,
                'description' => $event->description,
                'event_date' => $event->event_date ? Carbon::parse($event->event_date)->toIso8601String() : null,
            ] : null,
            'tickets' => $tickets,
            'stats' => Inertia::defer(fn () => $event ? [
                'total_tickets' => Ticket::where('event_id', $event->id)->count(),
                'scanned_count' => Ticket::where('event_id', $event->id)->where('scan_count', '>', 0)->count(),
                'not_scanned_count' => Ticket::where('event_id', $event->id)->where('scan_count', 0)->count(),
            ] : null),
        ]);
    }

    /**
     * Process a QR code scan. Returns JSON for real-time scanner feedback.
     * Uses pessimistic locking via ScanTicketAction to prevent double-scans.
     */
    public function scan(ScanTicketRequest $request, ScanTicketAction $action): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $event = Event::where('id', (string) $request->input('event_id'))->firstOrFail();

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
    public function import(ImportTicketsRequest $request, ProvisionTicketForEmailAction $action): RedirectResponse
    {
        $event = Event::where('id', (string) $request->input('event_id'))->firstOrFail();
        $file = $request->file('csv_file');
        /** @var resource $handle */
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
