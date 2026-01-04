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
            $refreshToken = decrypt($user->gmail_refresh_token);
        } catch (\Throwable $e) {
            // Log the specific error for debugging
            Log::error('Google Token Decrypt Error: '.$e->getMessage());
            throw new Exception('Your Google connection is invalid. Please disconnect and reconnect in Settings.');
        }

        try {
            // This might throw if the token was revoked by the user externally
            $token = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);

            // CHECK: Did Google rotate the refresh token?
            if (isset($token['refresh_token']) && $token['refresh_token'] !== $refreshToken) {
                $user->forceFill([
                    'gmail_refresh_token' => encrypt($token['refresh_token']),
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
            // Extract the actual message from Google's JSON error if possible
            $msg = json_decode($e->getMessage(), true)['error']['message'] ?? $e->getMessage();
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
            $params = ['valueInputOption' => 'USER_ENTERED'];
            $this->service->spreadsheets_values->update($spreadsheetId, $range, $body, $params);
        } catch (\Throwable $e) {
            Log::error('Google Data Update Error: '.$e->getMessage());
            throw new Exception('Failed to update sheet data: '.$e->getMessage());
        }
    }
}
