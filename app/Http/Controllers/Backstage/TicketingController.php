<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\MailTemplate;
use Inertia\Inertia;
use Inertia\Response;

class TicketingController extends Controller
{
    /**
     * Display the ticketing page.
     */
    public function index(): Response
    {
        $events = [];
        try {
            $events = Event::query()->orderBy('start_sell_date')->get();
        } catch (\Throwable $e) {
            // If the Event model/table isn't available yet (during some dev workflows),
            // fall back to an empty array to keep the page rendering.
            $events = [];
        }

        return Inertia::render('Backstage/ticketing', [
            'events' => $events,
            'templates' => MailTemplate::all(),
        ]);
    }
    /**
     * Fetch attendees for a specific event from Google Sheets (raw data, filtered).
     * Used by the Ticket Distributor UI.
     */
    public function getAttendees(\Illuminate\Http\Request $request, Event $event)
    {
        // Cache Key needs to include spreadsheet, sheetname, AND filter config
        // This ensures that updating the filter immediately invalidates the cache
        // because it generates a new key.
        $filterHash = md5(json_encode($event->attendee_filter_config ?? []));
        $cacheKey = 'ticketing_attendees_' . $event->id . '_' . $filterHash;

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 60, function () use ($event) {
            try {
                // Check if event has spreadsheet configured
                if (! $event->google_spreadsheet_id || ! $event->google_sheet_name) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Spreadsheet not configured for this event',
                        'rows' => [],
                    ]);
                }

                // Fetch raw data from Google Sheets
                $service = new \App\Services\GoogleSheetsService;
                $rows = $service->getSheetData($event->google_spreadsheet_id, $event->google_sheet_name);

                // Apply Filtering Logic (Backend-side)
                $rows = $event->filterRows($rows);

                return response()->json([
                    'success' => true,
                    'rows' => $rows ?? [],
                ]);
            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch attendees: '.$e->getMessage(),
                    'rows' => [],
                ], 500);
            }
        });
    }
}
