<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventAttendee;
use App\Services\GoogleSheetsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema; // Import Schema
use Illuminate\Database\Schema\Blueprint; // Import Blueprint
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // Import DB
use Inertia\Inertia;

class EventAttendeeController extends Controller
{
    public function index(Event $event)
    {
        $tableName = EventAttendee::generateTableName($event);
        $attendees = [];

        // 1. Check if the dynamic table exists in the 'attendees' database
        if (Schema::connection('attendees')->hasTable($tableName)) {
            // 2. If it exists, fetch data using the dynamic table name
            $attendees = EventAttendee::forEvent($event)
                ->orderBy('created_at', 'desc')
                ->get();
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
        // ... (Keep existing listSheets logic) ...
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

        // 1. Ensure the table exists before we try to save data
        $this->ensureTableExists($event);

        try {
            $service = new GoogleSheetsService();
            $rows = $service->getSheetData($event->google_spreadsheet_id, $event->google_sheet_name);

            if (empty($rows)) {
                return back()->with('error', 'Sheet is empty.');
            }

            $headers = array_map('strtolower', array_shift($rows));
            
            // Loose matching for column names
            $emailIdx = $this->findHeaderIndex($headers, ['email', 'e-mail', 'mail', 'email address']);
            $firstIdx = $this->findHeaderIndex($headers, ['first name', 'firstname', 'first', 'name']);
            $lastIdx = $this->findHeaderIndex($headers, ['last name', 'lastname', 'last', 'surname']);

            if ($emailIdx === false) {
                return back()->with('error', 'Could not find an "Email" column in the spreadsheet.');
            }

            $count = 0;
            $now = now();

            // ROBUST FIX: Use DB Builder to explicitly target the dynamic table
            // This prevents Eloquent from accidentally reverting to 'event_attendees'
            $tableName = EventAttendee::generateTableName($event);

            foreach ($rows as $row) {
                $email = $row[$emailIdx] ?? null;
                if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) continue;

                $firstName = ($firstIdx !== false) ? ($row[$firstIdx] ?? '') : '';
                $lastName = ($lastIdx !== false) ? ($row[$lastIdx] ?? '') : '';

                $exists = DB::connection('attendees')->table($tableName)
                    ->where('email', $email)
                    ->exists();

                if (!$exists) {
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

        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return back()->with('error', 'Sync failed: ' . $e->getMessage());
        }
    }

    /**
     * Creates the dynamic table if it does not exist.
     */
    private function ensureTableExists(Event $event)
    {
        $tableName = EventAttendee::generateTableName($event);
        $connection = Schema::connection('attendees');

        if (!$connection->hasTable($tableName)) {
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
            if ($index !== false) return $index;
        }
        return false;
    }
}