<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventAttendee;
use App\Services\GoogleSheetsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EventAttendeeController extends Controller
{
    public function index(Event $event)
    {
        return Inertia::render('Ticketing/Attendees', [
            'event' => $event,
            'attendees' => $event->attendees()->latest()->get(),
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

        if (!$spreadsheetId) {
            return response()->json(['sheets' => []]);
        }

        try {
            $service = new GoogleSheetsService();
            $sheets = $service->getSheetNames($spreadsheetId);
            return response()->json(['sheets' => $sheets]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    public function sync(Event $event)
    {
        if (!$event->google_spreadsheet_id || !$event->google_sheet_name) {
            return back()->with('error', 'Spreadsheet not configured.');
        }

        try {
            $service = new GoogleSheetsService();
            // Fetch all data from the selected sheet
            $rows = $service->getSheetData($event->google_spreadsheet_id, $event->google_sheet_name);

            if (empty($rows)) {
                return back()->with('error', 'Sheet is empty.');
            }

            // Assume first row is header
            $headers = array_map('strtolower', array_shift($rows));
            
            // Basic column mapping
            $emailIdx = $this->findHeaderIndex($headers, ['email', 'e-mail', 'mail']);
            $firstIdx = $this->findHeaderIndex($headers, ['first name', 'firstname', 'first']);
            $lastIdx = $this->findHeaderIndex($headers, ['last name', 'lastname', 'last', 'surname']);

            if ($emailIdx === false) {
                return back()->with('error', 'Could not find an "Email" column in the spreadsheet headers.');
            }

            $count = 0;
            foreach ($rows as $row) {
                $email = $row[$emailIdx] ?? null;
                if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) continue;

                $firstName = ($firstIdx !== false) ? ($row[$firstIdx] ?? '') : '';
                $lastName = ($lastIdx !== false) ? ($row[$lastIdx] ?? '') : '';

                // Create if not exists
                $attendee = EventAttendee::firstOrCreate(
                    [
                        'event_id' => $event->id,
                        'email' => $email,
                    ],
                    [
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        // 'ticket_code' => ... (Generate if needed, or leave nullable)
                    ]
                );
                
                if ($attendee->wasRecentlyCreated) {
                    $count++;
                }
            }

            return back()->with('success', "Sync complete. {$count} new attendees added.");

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return back()->with('error', 'Sync failed: ' . $e->getMessage());
        }
    }

    private function findHeaderIndex(array $headers, array $candidates)
    {
        foreach ($candidates as $candidate) {
            $index = array_search($candidate, $headers);
            if ($index !== false) return $index;
        }
        return false;
    }
}
