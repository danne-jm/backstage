<?php

namespace App\Http\Controllers;

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
        return Inertia::render('ticketing/attendees', [
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
        $spreadsheetId = $request->input('spreadsheet_id') ?? $event->google_spreadsheet_id;
        if (! $spreadsheetId) {
            return response()->json(['sheets' => []]);
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
        $spreadsheetId = $request->input('spreadsheet_id') ?? $event->google_spreadsheet_id;
        $sheetName = $request->input('sheet_name') ?? $event->google_sheet_name;

        if (! $spreadsheetId || ! $sheetName) {
            return response()->json(['error' => 'Missing spreadsheet_id or sheet_name'], 400);
        }

        try {
            $service = new GoogleSheetsService;
            $data = $service->getSheetData($spreadsheetId, $sheetName);

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
}
