<?php

namespace App\Services\Google;

use App\Contracts\SpreadsheetIntegrationInterface;
use App\Models\User;
use Google\Client;
use Google\Service\Sheets;
use Google\Service\Sheets\ValueRange;
use Illuminate\Support\Facades\Log;

class GoogleSheetsAdapter implements SpreadsheetIntegrationInterface
{
    protected Sheets $service;

    public function __construct(User $integrationUser)
    {
        if (empty($integrationUser->gmail_refresh_token)) {
            throw new \InvalidArgumentException("User {$integrationUser->email} does not have a Google OAuth token connected.");
        }

        $client = new Client();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->refreshToken($integrationUser->gmail_refresh_token);

        $this->service = new Sheets($client);
    }

    public function appendRow(string $spreadsheetId, string $sheetName, array $values): bool
    {
        return $this->appendRows($spreadsheetId, $sheetName, [$values]);
    }

    public function appendRows(string $spreadsheetId, string $sheetName, array $rows): bool
    {
        try {
            $range = "{$sheetName}!A:A"; // Append dynamically finds the end
            $valueRange = new ValueRange([
                'values' => $rows
            ]);

            $params = [
                'valueInputOption' => 'USER_ENTERED',
            ];

            $this->service->spreadsheets_values->append($spreadsheetId, $range, $valueRange, $params);
            
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to append rows to Google Sheet {$spreadsheetId}: " . $e->getMessage());
            return false;
        }
    }
}
