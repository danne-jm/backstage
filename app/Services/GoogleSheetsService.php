<?php

namespace App\Services;

use Google\Client;
use Google\Service\Sheets;
use Illuminate\Support\Facades\Auth;
use Exception;

class GoogleSheetsService
{
    protected $client;
    protected $service;

    public function __construct()
    {
        $user = Auth::user();
        
        if (!$user || !$user->gmail_refresh_token) {
            throw new Exception('User not connected to Google.');
        }

        $this->client = new Client();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        
        // FIX 1: Decrypt the token stored in the database
        try {
            $refreshToken = decrypt($user->gmail_refresh_token);
        } catch (\Throwable $e) {
            // If decryption fails (e.g., old data), force a reconnect
            throw new Exception('Invalid Google Token. Please disconnect and reconnect your account in Settings.');
        }

        // FIX 2: Explicitly exchange the refresh token for a usable Access Token
        // This sets the OAuth headers for subsequent requests
        $this->client->fetchAccessTokenWithRefreshToken($refreshToken);
        
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
            // Include specific error message for debugging
            throw new Exception('Failed to fetch sheets: ' . $e->getMessage());
        }
    }

    public function getSheetData(string $spreadsheetId, string $range): array
    {
        try {
            $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
            return $response->getValues() ?? [];
        } catch (\Throwable $e) {
            throw new Exception('Failed to fetch data: ' . $e->getMessage());
        }
    }
}