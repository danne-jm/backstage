<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\OnlineSale;
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

    /**
     * Validate purchase identifiers against online_sales for this event.
     * Fetches unfiltered data directly from Google Sheets, validates against online_sales,
     * applies cell formatting (green/red/orange background), and updates has_paid column.
     * Automatically resets validation session at the start for a clean validation run.
     */
    public function validatePurchases(Request $request, Event $event)
    {
        $spreadsheetId = $event->google_spreadsheet_id;
        $sheetName = $event->google_sheet_name;

        if (! $spreadsheetId || ! $sheetName) {
            return response()->json(['error' => 'Event has no configured spreadsheet or sheet'], 400);
        }

        try {
            $service = new GoogleSheetsService;

            // STEP 1: Reset validation session for this event (automatic reset)
            $sessionKey = "validated_identifiers_event_{$event->id}";
            session()->forget($sessionKey);
            $validatedIdentifiers = [];

            // Fetch ALL rows (unfiltered) directly from Google Sheets
            $allData = $service->getSheetData($spreadsheetId, $sheetName);

            if (empty($allData) || count($allData) < 2) {
                return response()->json(['error' => 'No data found in sheet'], 400);
            }

            $headers = $allData[0];
            $headerMap = [];
            foreach ($headers as $index => $header) {
                $headerMap[strtolower(trim($header))] = $index;
            }

            // Find required columns
            $purchaseIdCol = $headerMap['purchase_identifier'] ?? $headerMap['purchase identifier'] ?? null;
            $hasPaidCol = $headerMap['has_paid?'] ?? $headerMap['has_paid'] ?? $headerMap['has paid?'] ?? $headerMap['has paid'] ?? null;
            $paidOnlineCol = $headerMap['paid_online?'] ?? $headerMap['paid online?'] ?? $headerMap['paid_online'] ?? $headerMap['paid online'] ?? null;

            if ($purchaseIdCol === null) {
                return response()->json(['error' => 'purchase_identifier column not found'], 400);
            }

            // Collect all purchase identifiers and their row positions (only for rows with paid_online = TRUE)
            $purchaseIdentifiersToCheck = [];
            $rowsToProcess = []; // Maps purchase_identifier => array of row indices (0-indexed)

            for ($i = 1; $i < count($allData); $i++) {
                $row = $allData[$i];

                // Check if paid_online column exists and is TRUE
                if ($paidOnlineCol !== null) {
                    $paidOnlineValue = strtolower(trim($row[$paidOnlineCol] ?? ''));
                    if ($paidOnlineValue !== 'true' && $paidOnlineValue !== '1' && $paidOnlineValue !== 'yes') {
                        continue; // Skip non-online purchases
                    }
                }

                $purchaseId = trim($row[$purchaseIdCol] ?? '');
                if (! empty($purchaseId)) {
                    $purchaseIdentifiersToCheck[] = $purchaseId;
                    if (! isset($rowsToProcess[$purchaseId])) {
                        $rowsToProcess[$purchaseId] = [];
                    }
                    $rowsToProcess[$purchaseId][] = $i; // Store 0-indexed row
                }
            }

            if (empty($purchaseIdentifiersToCheck)) {
                return response()->json([
                    'results' => [],
                    'valid_count' => 0,
                    'total_checked' => 0,
                    'message' => 'No online purchases to validate',
                ]);
            }

            // Get all valid reference_ids for this event from online_sales
            $validReferenceIds = OnlineSale::where('event_id', $event->id)
                ->whereIn('reference_id', array_unique($purchaseIdentifiersToCheck))
                ->pluck('reference_id')
                ->toArray();

            // Get sheet ID for formatting
            $sheetId = $service->getSheetId($spreadsheetId, $sheetName);

            // Prepare cell formatting and has_paid updates
            $cellFormats = [];
            $valueUpdates = [];

            // Colors (RGB 0-1 scale)
            // #93c47d = RGB(147, 196, 125) = (0.576, 0.769, 0.490) - Green for valid
            // #ea9999 = RGB(234, 153, 153) = (0.918, 0.600, 0.600) - Red for invalid
            // #f6b26b = RGB(246, 178, 107) = (0.965, 0.698, 0.420) - Orange for duplicate
            $greenColor = ['red' => 0.576, 'green' => 0.769, 'blue' => 0.490];
            $redColor = ['red' => 0.918, 'green' => 0.600, 'blue' => 0.600];
            $orangeColor = ['red' => 0.965, 'green' => 0.698, 'blue' => 0.420];

            $results = [];
            $validCount = 0;
            $duplicateCount = 0;

            // STEP 2: Process each purchase identifier
            foreach ($rowsToProcess as $purchaseId => $rowIndices) {
                $isValidInDatabase = in_array($purchaseId, $validReferenceIds);

                foreach ($rowIndices as $rowIndex) {
                    // Check if this identifier was already validated in this run
                    $isDuplicate = in_array($purchaseId, $validatedIdentifiers);

                    // Determine color and validity
                    $color = $redColor; // Default to red (invalid)
                    $isValid = false;

                    if ($isValidInDatabase && ! $isDuplicate) {
                        // Valid and first time seen - green
                        $color = $greenColor;
                        $isValid = true;
                    } elseif ($isValidInDatabase && $isDuplicate) {
                        // Valid but already used - orange (duplicate)
                        $color = $orangeColor;
                        $isValid = false; // Treat as invalid for has_paid purposes
                        $duplicateCount++;
                    }
                    // else: invalid in database - stays red

                    // Add cell formatting for purchase_identifier column
                    $cellFormats[] = [
                        'row' => $rowIndex,
                        'col' => $purchaseIdCol,
                        'color' => $color,
                    ];

                    // Update has_paid column if it exists
                    if ($hasPaidCol !== null) {
                        $colLetter = $this->columnToLetter($hasPaidCol);
                        $rowNumber = $rowIndex + 1;

                        // Set to TRUE only if valid (first occurrence), FALSE otherwise
                        $hasPaidValue = $isValid ? 'TRUE' : 'FALSE';
                        $valueUpdates[] = [
                            'range' => "{$sheetName}!{$colLetter}{$rowNumber}",
                            'values' => [$hasPaidValue],
                        ];
                    }

                    // Store result for frontend
                    $results[$rowIndex] = $isValid;

                    if ($isValid) {
                        $validCount++;
                        // Mark this identifier as validated in this run
                        if (! in_array($purchaseId, $validatedIdentifiers)) {
                            $validatedIdentifiers[] = $purchaseId;
                        }
                    }
                }
            }

            // Update session with validated identifiers
            session([$sessionKey => $validatedIdentifiers]);

            // Apply formatting to Google Sheets
            if (! empty($cellFormats)) {
                $service->applyCellFormatting($spreadsheetId, $sheetId, $cellFormats);
            }

            // Update has_paid values
            if (! empty($valueUpdates)) {
                $service->batchUpdateValues($spreadsheetId, $valueUpdates);
            }

            return response()->json([
                'results' => $results,
                'valid_count' => $validCount,
                'duplicate_count' => $duplicateCount,
                'total_checked' => count($cellFormats),
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => 'Validation failed: '.$e->getMessage()], 500);
        }
    }

    /**
     * Convert column index to letter (0=A, 1=B, ..., 26=AA, etc.)
     */
    private function columnToLetter(int $columnIndex): string
    {
        $letter = '';
        $columnIndex++; // Convert to 1-indexed

        while ($columnIndex > 0) {
            $columnIndex--;
            $letter = chr(65 + ($columnIndex % 26)).$letter;
            $columnIndex = intval($columnIndex / 26);
        }

        return $letter;
    }
}
