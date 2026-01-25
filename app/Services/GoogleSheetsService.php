<?php

namespace App\Services;

use Exception;
use Google\Client;
use Google\Service\Sheets;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class GoogleSheetsService
{
    protected $client;

    protected $service;

    public function __construct()
    {
        $user = Auth::user();

        if (! $user || ! $user->gmail_refresh_token) {
            throw new Exception('User is not connected to Google.');
        }

        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        if (empty($clientId) || empty($clientSecret)) {
            throw new Exception('Google API Configuration is missing (CLIENT_ID or CLIENT_SECRET).');
        }

        $this->client = new Client;
        $this->client->setClientId($clientId);
        $this->client->setClientSecret($clientSecret);

        try {
            $refreshToken = $user->gmail_refresh_token;
        } catch (\Throwable $e) {
            // Log the specific error for debugging
            Log::error('Google Token Access/Decrypt Error: '.$e->getMessage());
            throw new Exception('Your Google connection is invalid. Please disconnect and reconnect in Settings.');
        }

        try {
            // This might throw if the token was revoked by the user externally
            $token = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);

            // CHECK: Did Google rotate the refresh token?
            if (isset($token['refresh_token']) && $token['refresh_token'] !== $refreshToken) {
                $user->forceFill([
                    'gmail_refresh_token' => $token['refresh_token'],
                ])->save();
            }
        } catch (\Throwable $e) {
            Log::error('Google Refresh Token Error: '.$e->getMessage());
            throw new Exception('Failed to authenticate with Google. Token may be expired.');
        }

        $this->service = new Sheets($this->client);
    }

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
            Log::error('Google Sheets Fetch Error: '.$e->getMessage());
            $msg = $e->getMessage();

            // Check for specific expiration/unregistered caller errors
            if (str_contains($msg, 'unregistered callers') || str_contains($msg, 'invalid_grant')) {
                throw new Exception('GOOGLE_TOKEN_EXPIRED');
            }

            // Extract the actual message from Google's JSON error if possible
            $decoded = json_decode($msg, true);
            if (isset($decoded['error']['message'])) {
                $msg = $decoded['error']['message'];
            }

            throw new Exception('Google Error: '.$msg);
        }
    }

    public function getSheetData(string $spreadsheetId, string $range): array
    {
        try {
            $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);

            return $response->getValues() ?? [];
        } catch (\Throwable $e) {
            Log::error('Google Data Fetch Error: '.$e->getMessage());
            throw new Exception('Failed to read sheet data: '.$e->getMessage());
        }
    }

    public function updateRow(string $spreadsheetId, string $range, array $values): void
    {
        try {
            $body = new \Google\Service\Sheets\ValueRange([
                'values' => [$values],
            ]);
            // SECURITY FIX: Use 'RAW' to prevent formula injection attacks.
            // 'USER_ENTERED' would allow malicious formulas (=IMPORTXML, etc.) to execute.
            $params = ['valueInputOption' => 'RAW'];
            $this->service->spreadsheets_values->update($spreadsheetId, $range, $body, $params);
        } catch (\Throwable $e) {
            Log::error('Google Data Update Error: '.$e->getMessage());
            throw new Exception('Failed to update sheet data: '.$e->getMessage());
        }
    }

    /**
     * Get the sheet ID for a given sheet name.
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
            Log::error('Google Sheet ID Fetch Error: '.$e->getMessage());
            throw new Exception('Failed to get sheet ID: '.$e->getMessage());
        }
    }

    /**
     * Apply background color to specific cells.
     *
     * @param  array  $cellFormats  Array of ['row' => int, 'col' => int, 'color' => ['red' => float, 'green' => float, 'blue' => float]]
     */
    public function applyCellFormatting(string $spreadsheetId, int $sheetId, array $cellFormats): void
    {
        if (empty($cellFormats)) {
            return;
        }

        try {
            $requests = [];

            foreach ($cellFormats as $format) {
                $requests[] = new \Google\Service\Sheets\Request([
                    'repeatCell' => [
                        'range' => [
                            'sheetId' => $sheetId,
                            'startRowIndex' => $format['row'],
                            'endRowIndex' => $format['row'] + 1,
                            'startColumnIndex' => $format['col'],
                            'endColumnIndex' => $format['col'] + 1,
                        ],
                        'cell' => [
                            'userEnteredFormat' => [
                                'backgroundColor' => $format['color'],
                            ],
                        ],
                        'fields' => 'userEnteredFormat.backgroundColor',
                    ],
                ]);
            }

            $batchUpdateRequest = new \Google\Service\Sheets\BatchUpdateSpreadsheetRequest([
                'requests' => $requests,
            ]);

            $this->service->spreadsheets->batchUpdate($spreadsheetId, $batchUpdateRequest);
        } catch (\Throwable $e) {
            Log::error('Google Cell Formatting Error: '.$e->getMessage());
            throw new Exception('Failed to apply cell formatting: '.$e->getMessage());
        }
    }

    /**
     * Update multiple cells at once.
     *
     * @param  array  $updates  Array of ['range' => string, 'values' => array]
     */
    public function batchUpdateValues(string $spreadsheetId, array $updates): void
    {
        if (empty($updates)) {
            return;
        }

        try {
            $data = [];
            foreach ($updates as $update) {
                $data[] = new \Google\Service\Sheets\ValueRange([
                    'range' => $update['range'],
                    'values' => [$update['values']],
                ]);
            }

            $body = new \Google\Service\Sheets\BatchUpdateValuesRequest([
                'valueInputOption' => 'RAW',
                'data' => $data,
            ]);

            $this->service->spreadsheets_values->batchUpdate($spreadsheetId, $body);
        } catch (\Throwable $e) {
            Log::error('Google Batch Update Error: '.$e->getMessage());
            throw new Exception('Failed to batch update values: '.$e->getMessage());
        }
    }
}
