<?php

namespace App\Http\Controllers\Backstage;

use App\Actions\Integrations\SyncAttendeesToSheetAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\UpdateAttendeeFilterConfigRequest;
use App\Models\Event;
use App\Models\Sale;
use App\Models\Ticket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventAttendeeController extends Controller
{
    /**
     * Display the attendee list for an event, with column filter config.
     */
    public function index(Event $event): Response
    {
        $attendees = Ticket::where('event_id', $event->id)
            ->orderBy('created_at')
            ->get()
            ->map(fn (Ticket $ticket) => [
                'id' => $ticket->id,
                'ticket_code' => $ticket->ticket_code,
                'email' => $ticket->email,
                'first_name' => $ticket->first_name,
                'last_name' => $ticket->last_name,
                'scan_count' => $ticket->scan_count,
                'scanned_at' => $ticket->scanned_at?->toIso8601String(),
            ]);

        return Inertia::render('backstage/attendees/index', [
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'event_date' => $event->event_date?->toIso8601String(),
                'google_spreadsheet_id' => $event->google_spreadsheet_id,
                'google_sheet_name' => $event->google_sheet_name,
                'attendee_filter_config' => $event->attendee_filter_config,
            ],
            'attendees' => $attendees,
            'total_count' => $attendees->count(),
            'scanned_count' => $attendees->where('scan_count', '>', 0)->count(),
        ]);
    }

    /**
     * Manually sync the attendee list to the connected Google Sheet.
     */
    public function syncToSheet(Request $request, Event $event, SyncAttendeesToSheetAction $action): RedirectResponse
    {
        if (empty($event->google_spreadsheet_id)) {
            return back()->withErrors(['sheet' => 'No Google Sheet is configured for this event.']);
        }

        // Sync all ticket sales for this event
        $sales = Sale::whereHasMorph('purchasable', [Event::class], fn ($q) => $q->where('id', $event->id))
            ->with('transaction')
            ->get();

        if ($sales->isEmpty()) {
            return back()->with('info', 'No sales found to sync.');
        }

        foreach ($sales as $sale) {
            $action->handle($event, $sale);
        }

        return back()->with('success', "Synced {$sales->count()} attendee(s) to Google Sheets.");
    }

    /**
     * Update the column filter configuration for the attendee view.
     */
    public function updateFilterConfig(UpdateAttendeeFilterConfigRequest $request, Event $event): RedirectResponse
    {
        $event->update([
            'attendee_filter_config' => $request->input('attendee_filter_config'),
        ]);

        return back()->with('success', 'Attendee filter configuration updated.');
    }
}
