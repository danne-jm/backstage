<?php

namespace App\Http\Controllers;

use App\Models\sellables\Event;
use App\Services\AttendeeService;
use App\Services\GoogleSheetsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventAttendeeController extends Controller
{
    protected AttendeeService $attendeeService;
    protected GoogleSheetsService $sheetsService;

    public function __construct(AttendeeService $attendeeService, GoogleSheetsService $sheetsService)
    {
        $this->attendeeService = $attendeeService;
        $this->sheetsService = $sheetsService;
    }

    public function index(Event $event)
    {
        return Inertia::render('sellables/attendees', [
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
        // Prefer the live param sent by the frontend (before config is saved),
        // fall back to the event's persisted spreadsheet ID.
        $spreadsheetId = $request->query('spreadsheet_id') ?: $event->google_spreadsheet_id;

        if (!$spreadsheetId) {
            return response()->json(['sheets' => [], 'error' => 'No spreadsheet ID provided']);
        }

        try {
            $sheets = $this->sheetsService->getSheetNames(trim($spreadsheetId));
            return response()->json(['sheets' => $sheets]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getSheetData(Request $request, Event $event)
    {
        try {
            $sheetName = $request->input('sheet_name');
            $unfiltered = $request->boolean('unfiltered');
            $data = $this->attendeeService->getAttendeeData($event, $sheetName, $unfiltered);

            return response()->json([
                'spreadsheet_id' => $event->google_spreadsheet_id,
                'sheet_name' => $sheetName ?? $event->google_sheet_name,
                'rows' => $data,
                'row_count' => count($data),
                'unfiltered' => $unfiltered,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Event $event)
    {
        $request->validate([
            'range' => ['required', 'string'],
            'values' => ['required', 'array'],
        ]);

        $spreadsheetId = $event->google_spreadsheet_id;
        if (!$spreadsheetId) {
            return response()->json(['success' => false, 'message' => 'Event has no configured spreadsheet'], 400);
        }

        try {
            $this->sheetsService->updateRow(
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

    public function validatePurchases(Event $event)
    {
        try {
            $result = $this->attendeeService->validatePurchases($event);
            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function verifyEmails(Event $event)
    {
        try {
            $result = $this->attendeeService->verifyEmails($event);
            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
