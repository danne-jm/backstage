<?php

namespace App\Services;

use Exception;
use Google\Client;
use Google\Service\Sheets;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Service for interacting with Google Sheets API
 * Handles fetching data from spreadsheets using authenticated user's token
 */
class GoogleSheetsService
{
    protected Client $client;
    protected Sheets $service;

    /**
     * Initialize Google Sheets service with authenticated user's credentials
     * 
     * @throws Exception if user is not authenticated or Google config is missing
     */
    public function __construct()
    {
        $user = Auth::user();

        if (!$user || !$user->gmail_refresh_token) {
            throw new Exception('User is not connected to Google.');
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            throw new Exception('Google API Configuration is missing (CLIENT_ID or CLIENT_SECRET).');
        }

        $this->client = new Client();
        $this->client->setClientId($clientId);
        $this->client->setClientSecret($clientSecret);

        try {
            $refreshToken = $user->gmail_refresh_token;
        } catch (\Throwable $e) {
            Log::error('Google Token Access/Decrypt Error: ' . $e->getMessage());
            throw new Exception('Your Google connection is invalid. Please disconnect and reconnect in Settings.');
        }

        try {
            // Fetch access token using refresh token
            $token = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);

            // Check if Google rotated the refresh token
            if (isset($token['refresh_token']) && $token['refresh_token'] !== $refreshToken) {
                $user->forceFill([
                    'gmail_refresh_token' => $token['refresh_token'],
                ])->save();
            }
        } catch (\Throwable $e) {
            Log::error('Google Refresh Token Error: ' . $e->getMessage());
            throw new Exception('Failed to authenticate with Google. Token may be expired.');
        }

        $this->service = new Sheets($this->client);
    }

    /**
     * Get list of sheet names from a spreadsheet
     * 
     * @param string $spreadsheetId The ID of the spreadsheet
     * @return array List of sheet names
     * @throws Exception if fetch fails
     */
    public function getSheetNames(string $spreadsheetId): array
    {
        try {
            $spreadsheet = $this->service->spreadsheets->get($spreadsheetId);
            $sheets = [];

            foreach ($spreadsheet->getSheets() as $sheet) {
                $sheets[] = $sheet->getProperties()->getTitle();
            }

            return $sheets;
        } catch (\Throwable $e) {
            Log::error('Google Sheets Fetch Error: ' . $e->getMessage());
            $msg = $e->getMessage();

            // Check for token expiration
            if (str_contains($msg, 'unregistered callers') || str_contains($msg, 'invalid_grant')) {
                throw new Exception('GOOGLE_TOKEN_EXPIRED');
            }

            // Extract error message from Google's JSON error
            $decoded = json_decode($msg, true);
            if (isset($decoded['error']['message'])) {
                $msg = $decoded['error']['message'];
            }

            throw new Exception('Google Error: ' . $msg);
        }
    }

    /**
     * Get data from a Google Sheet
     * 
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $range The range to fetch (e.g., "Sheet1!A1:Z100" or just "Sheet1")
     * @return array Array of rows, where each row is an array of values
     * @throws Exception if fetch fails
     */
    public function getSheetData(string $spreadsheetId, string $range): array
    {
        try {
            $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
            return $response->getValues() ?? [];
        } catch (\Throwable $e) {
            Log::error('Google Data Fetch Error: ' . $e->getMessage());

            $msg = $e->getMessage();

            // Check for token expiration
            if (str_contains($msg, 'unregistered callers') || str_contains($msg, 'invalid_grant')) {
                throw new Exception('GOOGLE_TOKEN_EXPIRED');
            }

            throw new Exception('Failed to read sheet data: ' . $e->getMessage());
        }
    }

    /**
     * Update a row in a Google Sheet
     * 
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $range The range to update (e.g., "Sheet1!A2:Z2")
     * @param array $values Array of values to write
     * @throws Exception if update fails
     */
    public function updateRow(string $spreadsheetId, string $range, array $values): void
    {
        try {
            $body = new \Google\Service\Sheets\ValueRange([
                'values' => [$values],
            ]);

            // Use 'RAW' to prevent formula injection attacks
            $params = ['valueInputOption' => 'RAW'];
            $this->service->spreadsheets_values->update($spreadsheetId, $range, $body, $params);
        } catch (\Throwable $e) {
            Log::error('Google Data Update Error: ' . $e->getMessage());
            throw new Exception('Failed to update sheet data: ' . $e->getMessage());
        }
    }

    /**
     * Get the sheet ID for a given sheet name
     * 
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $sheetName The name of the sheet
     * @return int The sheet ID
     * @throws Exception if sheet not found
     */
    public function getSheetId(string $spreadsheetId, string $sheetName): int
    {
        try {
            $spreadsheet = $this->service->spreadsheets->get($spreadsheetId);

            foreach ($spreadsheet->getSheets() as $sheet) {
                if ($sheet->getProperties()->getTitle() === $sheetName) {
                    return $sheet->getProperties()->getSheetId();
                }
            }

            throw new Exception("Sheet '{$sheetName}' not found");
        } catch (\Throwable $e) {
            Log::error('Google Sheet ID Fetch Error: ' . $e->getMessage());
            throw new Exception('Failed to get sheet ID: ' . $e->getMessage());
        }
    }

    /**
     * Apply background colour formatting to a list of cells via batchUpdate
     *
     * @param string $spreadsheetId
     * @param int    $sheetId      Numeric sheet ID (from getSheetId)
     * @param array  $formats      Each entry: ['row' => int, 'col' => int, 'color' => ['red'=>…,'green'=>…,'blue'=>…]]
     */
    public function applyCellFormatting(string $spreadsheetId, int $sheetId, array $formats): void
    {
        if (empty($formats))
            return;

        $requests = [];
        foreach ($formats as $fmt) {
            $row = (int) $fmt['row'];
            $col = (int) $fmt['col'];
            $color = $fmt['color'];

            $requests[] = [
                'repeatCell' => [
                    'range' => [
                        'sheetId' => $sheetId,
                        'startRowIndex' => $row,
                        'endRowIndex' => $row + 1,
                        'startColumnIndex' => $col,
                        'endColumnIndex' => $col + 1,
                    ],
                    'cell' => [
                        'userEnteredFormat' => [
                            'backgroundColor' => [
                                'red' => (float) ($color['red'] ?? 1),
                                'green' => (float) ($color['green'] ?? 1),
                                'blue' => (float) ($color['blue'] ?? 1),
                            ],
                        ],
                    ],
                    'fields' => 'userEnteredFormat.backgroundColor',
                ],
            ];
        }

        try {
            $batchUpdateRequest = new \Google\Service\Sheets\BatchUpdateSpreadsheetRequest([
                'requests' => $requests,
            ]);
            $this->service->spreadsheets->batchUpdate($spreadsheetId, $batchUpdateRequest);
        } catch (\Throwable $e) {
            Log::error('Google Cell Formatting Error: ' . $e->getMessage());
            throw new Exception('Failed to apply cell formatting: ' . $e->getMessage());
        }
    }

    /**
     * Write values to multiple ranges in a single API call
     *
     * @param string $spreadsheetId
     * @param array  $updates  Each entry: ['range' => 'Sheet1!A2', 'values' => ['value']]
     */
    public function batchUpdateValues(string $spreadsheetId, array $updates): void
    {
        if (empty($updates))
            return;

        $data = [];
        foreach ($updates as $update) {
            $data[] = new \Google\Service\Sheets\ValueRange([
                'range' => $update['range'],
                'values' => [$update['values']],
            ]);
        }

        try {
            $body = new \Google\Service\Sheets\BatchUpdateValuesRequest([
                'valueInputOption' => 'RAW',
                'data' => $data,
            ]);
            $this->service->spreadsheets_values->batchUpdate($spreadsheetId, $body);
        } catch (\Throwable $e) {
            Log::error('Google Batch Value Update Error: ' . $e->getMessage());
            throw new Exception('Failed to batch update values: ' . $e->getMessage());
        }
    }
}
