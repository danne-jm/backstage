<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventAttendee;
use App\Services\GoogleSheetsService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request; // Import Schema
use Illuminate\Support\Facades\DB; // Import Blueprint
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema; // Import DB
use Inertia\Inertia;

class EventAttendeeController extends Controller
{
    public function index(Event $event)
    {
        $tableName = EventAttendee::generateTableName($event);
        $attendees = [];

        // Log what we are looking for to storage/logs/laravel.log
        Log::info("Fetching attendees for event {$event->id} from table: {$tableName}");

        if (Schema::connection('attendees')->hasTable($tableName)) {
            // Directly query the table to avoid any Eloquent model confusion
            $attendees = DB::connection('attendees')
                ->table($tableName)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            Log::info("Table {$tableName} does not exist yet.");
        }

        return Inertia::render('ticketing/attendees', [
            'event' => $event,
            'attendees' => $attendees,
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

    public function sync(Event $event)
    {
        // 1. Validation
        if (! $event->google_spreadsheet_id || ! $event->google_sheet_name) {
            return back()->with('error', 'Spreadsheet not configured.');
        }

        try {
            // 2. Setup
            $this->ensureTableExists($event);
            $tableName = EventAttendee::generateTableName($event);

            Log::info("Starting sync for Event {$event->id} into table {$tableName}");

            $service = new GoogleSheetsService;
            $rows = $service->getSheetData($event->google_spreadsheet_id, $event->google_sheet_name);

            if (empty($rows)) {
                return back()->with('error', 'Sheet is empty or no data found.');
            }

            // 3. Header parsing
            $headers = array_map('strtolower', array_map('trim', array_shift($rows)));

            $emailIdx = $this->findHeaderIndex($headers, ['email', 'e-mail', 'mail', 'email address']);
            $firstIdx = $this->findHeaderIndex($headers, ['first name', 'firstname', 'first', 'name']);
            $lastIdx = $this->findHeaderIndex($headers, ['last name', 'lastname', 'last', 'surname']);

            if ($emailIdx === false) {
                return back()->with('error', "Column 'Email' not found in headers: ".implode(', ', $headers));
            }

            // 4. Processing
            $count = 0;
            $now = now();

            foreach ($rows as $row) {
                $email = isset($row[$emailIdx]) ? trim($row[$emailIdx]) : null;

                // Skip invalid emails
                if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    continue;
                }

                $firstName = ($firstIdx !== false && isset($row[$firstIdx])) ? trim($row[$firstIdx]) : '';
                $lastName = ($lastIdx !== false && isset($row[$lastIdx])) ? trim($row[$lastIdx]) : '';

                // Insert only if not exists (using manual DB query for safety)
                $exists = DB::connection('attendees')->table($tableName)->where('email', $email)->exists();

                if (! $exists) {
                    DB::connection('attendees')->table($tableName)->insert([
                        'email' => $email,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'esn_card' => 0,
                        'nationality' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    $count++;
                }
            }

            return back()->with('success', "Sync complete. {$count} new attendees added.");

        } catch (\Throwable $e) {
            // CATCH ALL ERRORS prevents infinite loading
            Log::error('Sync Fatal Error: '.$e->getMessage());

            return back()->with('error', 'Sync Failed: '.$e->getMessage());
        }
    }

    /**
     * Creates the dynamic table if it does not exist.
     */
    private function ensureTableExists(Event $event)
    {
        $tableName = EventAttendee::generateTableName($event);
        $connection = Schema::connection('attendees');

        if (! $connection->hasTable($tableName)) {
            $connection->create($tableName, function (Blueprint $table) {
                $table->id();
                $table->string('first_name')->nullable();
                $table->string('last_name')->nullable();
                $table->string('email')->unique(); // Unique email per event
                $table->string('nationality')->nullable();
                $table->boolean('esn_card')->default(false);
                $table->timestamps();
            });
        }
    }

    private function findHeaderIndex(array $headers, array $candidates)
    {
        foreach ($candidates as $candidate) {
            $index = array_search($candidate, $headers);
            if ($index !== false) {
                return $index;
            }
        }

        return false;
    }
}
