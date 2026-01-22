<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\GoogleSheetsService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request; // Import Schema
use Illuminate\Support\Facades\DB; // Import Blueprint
use Illuminate\Support\Facades\Schema; // Import DB
use Inertia\Inertia;

class EventAttendeeController extends Controller
{
    public function index(Event $event)
    {
        // Frontend fetches attendees directly from Google Sheets via the sheet-data endpoint
        // No need to parse or pass attendees here
        return Inertia::render('Backstage/attendees', [
            'event' => $event,
        ]);
    }

    public function updateConfiguration(Request $request, Event $event)
    {
        $data = $request->validate([
            'google_spreadsheet_id' => ['nullable', 'string'],
            'google_sheet_name' => ['nullable', 'string'],
        ]);

        $event->update($data);

        return back()->with('success', 'Configuration updated.');
    }

    public function listSheets(Request $request, Event $event)
    {
        // SECURITY FIX: Always use the event's configured spreadsheet ID.
        // Do NOT trust user-supplied spreadsheet_id to prevent masquerading attacks.
        $spreadsheetId = $event->google_spreadsheet_id;
        if (! $spreadsheetId) {
            return response()->json(['sheets' => [], 'error' => 'Event has no configured spreadsheet']);
        }

        try {
            $service = new GoogleSheetsService;
            $sheets = $service->getSheetNames($spreadsheetId);

            return response()->json(['sheets' => $sheets]);
        } catch (\Throwable $e) {
            // Return 500 so frontend catches it
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getSheetData(Request $request, Event $event)
    {
        // SECURITY FIX: Always use the event's configured spreadsheet ID.
        $spreadsheetId = $event->google_spreadsheet_id;
        $sheetName = $request->input('sheet_name') ?? $event->google_sheet_name;

        if (! $spreadsheetId || ! $sheetName) {
            return response()->json(['error' => 'Event has no configured spreadsheet or sheet name'], 400);
        }

        try {
            $service = new GoogleSheetsService;
            $data = $service->getSheetData($spreadsheetId, $sheetName);
            $data = $event->filterRows($data);

            return response()->json([
                'spreadsheet_id' => $spreadsheetId,
                'sheet_name' => $sheetName,
                'rows' => $data,
                'row_count' => count($data),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Event $event)
    {
        $request->validate([
            'range' => ['required', 'string'], // e.g. "Sheet1!A2:E2"
            'values' => ['required', 'array'],
        ]);

        // SECURITY FIX: Always use the event's configured spreadsheet ID.
        // Do NOT trust user-supplied spreadsheet_id to prevent masquerading attacks.
        $spreadsheetId = $event->google_spreadsheet_id;
        if (! $spreadsheetId) {
            return response()->json(['success' => false, 'message' => 'Event has no configured spreadsheet'], 400);
        }

        try {
            $service = new GoogleSheetsService;
            $service->updateRow(
                $spreadsheetId,
                $request->input('range'),
                $request->input('values')
            );

            return response()->json(['success' => true]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateFilter(Request $request, Event $event)
    {
        $data = $request->validate([
            'filter_config' => ['nullable', 'array'],
        ]);

        $event->update([
            'attendee_filter_config' => $data['filter_config'],
        ]);

        return back()->with('success', 'Filter configuration updated.');
    }
}
