<?php

namespace App\Services;

use App\Models\sellables\Event;
use App\Models\OnlineSale;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AttendeeService
{
    protected GoogleSheetsService $sheetsService;
    protected EmailVerificationService $emailVerifier;

    public function __construct(GoogleSheetsService $sheetsService, EmailVerificationService $emailVerifier)
    {
        $this->sheetsService = $sheetsService;
        $this->emailVerifier = $emailVerifier;
    }

    /**
     * Get filtered attendee data from Google Sheets
     */
    public function getAttendeeData(Event $event, ?string $sheetName = null, bool $unfiltered = false): array
    {
        $spreadsheetId = $event->google_spreadsheet_id;
        $sheetName = $sheetName ?? $event->google_sheet_name;

        if (!$spreadsheetId || !$sheetName) {
            throw new Exception('Event has no configured spreadsheet or sheet name');
        }

        $filterConfig = $event->attendee_filter_config ?? [];

        // Skip caching and filtering if unfiltered is requested
        if ($unfiltered) {
            return $this->sheetsService->getSheetData($spreadsheetId, $sheetName);
        }

        $filterHash = md5(json_encode($filterConfig));
        $cacheKey = 'sheet_data_' . md5($spreadsheetId . $sheetName . $filterHash);

        return Cache::remember($cacheKey, 60, function () use ($spreadsheetId, $sheetName, $filterConfig) {
            $data = $this->sheetsService->getSheetData($spreadsheetId, $sheetName);
            return $this->filterRows($data, $filterConfig);
        });
    }

    /**
     * Validate purchase identifiers against online_sales
     */
    public function validatePurchases(Event $event): array
    {
        $spreadsheetId = $event->google_spreadsheet_id;
        $sheetName = $event->google_sheet_name;

        if (!$spreadsheetId || !$sheetName) {
            throw new Exception('Event has no configured spreadsheet or sheet');
        }

        // Reset validation session
        $sessionKey = "validated_identifiers_event_{$event->id}";
        session()->forget($sessionKey);
        $validatedIdentifiers = [];

        $allData = $this->sheetsService->getSheetData($spreadsheetId, $sheetName);
        if (empty($allData) || count($allData) < 2) {
            throw new Exception('No data found in sheet');
        }

        $headers = array_map('strtolower', array_map('trim', $allData[0]));
        $headerMap = array_flip($headers);

        $purchaseIdCol = $headerMap['purchase_identifier'] ?? $headerMap['purchase identifier'] ?? null;
        $hasPaidCol = $headerMap['has_paid?'] ?? $headerMap['has_paid'] ?? $headerMap['has paid?'] ?? $headerMap['has paid'] ?? null;
        $paidOnlineCol = $headerMap['paid_online?'] ?? $headerMap['paid online?'] ?? $headerMap['paid_online'] ?? $headerMap['paid online'] ?? null;

        if ($purchaseIdCol === null) {
            throw new Exception('purchase_identifier column not found');
        }

        $purchaseIdentifiersToCheck = [];
        $rowsToProcess = [];

        for ($i = 1; $i < count($allData); $i++) {
            $row = $allData[$i];

            // Skip non-online purchases if column exists
            if ($paidOnlineCol !== null) {
                $paidOnlineValue = strtolower(trim($row[$paidOnlineCol] ?? ''));
                if (!in_array($paidOnlineValue, ['true', '1', 'yes'])) {
                    continue;
                }
            }

            $purchaseId = trim($row[$purchaseIdCol] ?? '');
            if (!empty($purchaseId)) {
                $purchaseIdentifiersToCheck[] = $purchaseId;
                $rowsToProcess[$purchaseId][] = $i;
            }
        }

        if (empty($purchaseIdentifiersToCheck)) {
            return [
                'results' => [],
                'valid_count' => 0,
                'total_checked' => 0,
                'message' => 'No online purchases to validate',
            ];
        }

        $validReferenceIds = OnlineSale::where('event_id', $event->id)
            ->whereIn('reference_id', array_unique($purchaseIdentifiersToCheck))
            ->pluck('reference_id')
            ->toArray();

        $sheetId = $this->sheetsService->getSheetId($spreadsheetId, $sheetName);
        $cellFormats = [];
        $valueUpdates = [];
        $results = [];
        $validCount = 0;
        $duplicateCount = 0;

        $greenColor = ['red' => 0.576, 'green' => 0.769, 'blue' => 0.490];
        $redColor = ['red' => 0.918, 'green' => 0.600, 'blue' => 0.600];
        $orangeColor = ['red' => 0.965, 'green' => 0.698, 'blue' => 0.420];

        foreach ($rowsToProcess as $purchaseId => $rowIndices) {
            $isValidInDatabase = in_array($purchaseId, $validReferenceIds);

            foreach ($rowIndices as $rowIndex) {
                $isDuplicate = in_array($purchaseId, $validatedIdentifiers);
                $color = $redColor;
                $isValid = false;

                if ($isValidInDatabase && !$isDuplicate) {
                    $color = $greenColor;
                    $isValid = true;
                    $validCount++;
                    $validatedIdentifiers[] = $purchaseId;
                } elseif ($isValidInDatabase && $isDuplicate) {
                    $color = $orangeColor;
                    $duplicateCount++;
                }

                $cellFormats[] = [
                    'row' => $rowIndex,
                    'col' => $purchaseIdCol,
                    'color' => $color,
                ];

                if ($hasPaidCol !== null) {
                    $colLetter = $this->columnToLetter($hasPaidCol);
                    $rowNumber = $rowIndex + 1;
                    $valueUpdates[] = [
                        'range' => "{$sheetName}!{$colLetter}{$rowNumber}",
                        'values' => [$isValid ? 'TRUE' : 'FALSE'],
                    ];
                }

                $results[$rowIndex] = $isValid;
            }
        }

        session([$sessionKey => $validatedIdentifiers]);

        if (!empty($cellFormats)) {
            $this->sheetsService->applyCellFormatting($spreadsheetId, $sheetId, $cellFormats);
        }

        if (!empty($valueUpdates)) {
            $this->sheetsService->batchUpdateValues($spreadsheetId, $valueUpdates);
        }

        return [
            'results' => $results,
            'valid_count' => $validCount,
            'duplicate_count' => $duplicateCount,
            'total_checked' => count($cellFormats),
        ];
    }

    /**
     * Verify attendee email domains
     */
    public function verifyEmails(Event $event): array
    {
        $spreadsheetId = $event->google_spreadsheet_id;
        $sheetName = $event->google_sheet_name;

        if (!$spreadsheetId || !$sheetName) {
            throw new Exception('Event has no configured spreadsheet or sheet');
        }

        $allData = $this->sheetsService->getSheetData($spreadsheetId, $sheetName);
        if (empty($allData) || count($allData) < 2) {
            throw new Exception('No data found in sheet');
        }

        $headers = array_map('strtolower', array_map('trim', $allData[0]));
        $emailCol = array_search('email', $headers);

        if ($emailCol === false) {
            throw new Exception('Email column not found');
        }

        $sheetId = $this->sheetsService->getSheetId($spreadsheetId, $sheetName);
        $cellFormats = [];
        $results = [];
        $validCount = 0;
        $invalidCount = 0;

        $greenColor = ['red' => 0.576, 'green' => 0.769, 'blue' => 0.490];
        $redColor = ['red' => 0.918, 'green' => 0.600, 'blue' => 0.600];

        for ($i = 1; $i < count($allData); $i++) {
            $email = trim($allData[$i][$emailCol] ?? '');
            if (empty($email))
                continue;

            $verification = $this->emailVerifier->verify($email);
            $isValid = $verification['valid'];

            $cellFormats[] = [
                'row' => $i,
                'col' => $emailCol,
                'color' => $isValid ? $greenColor : $redColor,
            ];

            if ($isValid)
                $validCount++;
            else
                $invalidCount++;
            $results[$i] = $verification;
        }

        if (!empty($cellFormats)) {
            $this->sheetsService->applyCellFormatting($spreadsheetId, $sheetId, $cellFormats);
        }

        return [
            'valid_count' => $validCount,
            'invalid_count' => $invalidCount,
            'total_checked' => $validCount + $invalidCount,
            'results' => $results,
        ];
    }

    /**
     * Filter rows based on configuration
     */
    public function filterRows(array $rows, array $filterConfig): array
    {
        if (empty($filterConfig) || count($rows) <= 1) {
            return $rows;
        }

        $headers = array_map('trim', $rows[0]);
        $filteredRows = [$rows[0]];
        $dataRows = array_slice($rows, 1);

        foreach ($dataRows as $row) {
            $match = true;
            foreach ($filterConfig as $rule) {
                $column = $rule['column'] ?? null;
                $operator = $rule['operator'] ?? null;
                $value = $rule['value'] ?? null;

                if (!$column || !$operator)
                    continue;

                $columnIndex = array_search($column, $headers);
                if ($columnIndex === false)
                    continue;

                $cellValue = isset($row[$columnIndex]) ? trim($row[$columnIndex]) : '';

                switch ($operator) {
                    case 'equals':
                        if (strcasecmp($cellValue, $value) !== 0)
                            $match = false;
                        break;
                    case 'contains':
                        if (stripos($cellValue, $value) === false)
                            $match = false;
                        break;
                    case 'not_contains':
                        if (stripos($cellValue, $value) !== false)
                            $match = false;
                        break;
                    case 'is_checked':
                        if (strtoupper($cellValue) !== 'TRUE')
                            $match = false;
                        break;
                    case 'is_not_checked':
                        if (strtoupper($cellValue) === 'TRUE')
                            $match = false;
                        break;
                    case 'is_empty':
                        if ($cellValue !== '')
                            $match = false;
                        break;
                    case 'is_not_empty':
                        if ($cellValue === '')
                            $match = false;
                        break;
                }

                if (!$match)
                    break;
            }

            if ($match) {
                $filteredRows[] = $row;
            }
        }

        return array_values($filteredRows);
    }

    private function columnToLetter(int $columnIndex): string
    {
        $letter = '';
        $columnIndex++;
        while ($columnIndex > 0) {
            $columnIndex--;
            $letter = chr(65 + ($columnIndex % 26)) . $letter;
            $columnIndex = intval($columnIndex / 26);
        }
        return $letter;
    }
}
