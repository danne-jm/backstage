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

        $client = new Client;
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
                'values' => $rows,
            ]);

            $params = [
                'valueInputOption' => 'USER_ENTERED',
            ];

            $this->service->spreadsheets_values->append($spreadsheetId, $range, $valueRange, $params);

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to append rows to Google Sheet {$spreadsheetId}: ".$e->getMessage());

            return false;
        }
    }

    public function getHeaders(string $spreadsheetId, ?string $sheetName = null): array
    {
        $range = $sheetName ? "{$sheetName}!1:1" : '1:1';
        $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
        $values = $response->getValues();

        if (empty($values) || empty($values[0])) {
            return [];
        }

        return $values[0];
    }

    public function getRows(string $spreadsheetId, ?string $sheetName = null, int $limit = 50): array
    {
        // Fetch headers and data rows in one go
        $range = $sheetName ? "{$sheetName}!A1:Z{$limit}" : "A1:Z{$limit}";
        $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
        $values = $response->getValues();

        if (empty($values) || count($values) < 2) {
            return [];
        }

        $headers = array_shift($values);
        $rows = [];

        foreach ($values as $row) {
            $rowData = [];
            foreach ($headers as $index => $header) {
                $rowData[$header] = $row[$index] ?? null;
            }
            $rows[] = $rowData;
        }

        return $rows;
    }
}
