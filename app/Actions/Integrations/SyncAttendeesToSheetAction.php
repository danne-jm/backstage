<?php

namespace App\Actions\Integrations;

use App\Models\Event;
use App\Models\Sale;
use App\Services\Google\GoogleSheetsAdapter;

class SyncAttendeesToSheetAction
{
    /**
     * Appends a new sale as a row in the configured Google Sheet for an Event.
     */
    public function handle(Event $event, Sale $sale): void
    {
        // 1. Check if the event is configured for Google Sheets
        if (empty($event->google_spreadsheet_id) || empty($event->google_sheet_name)) {
            return;
        }

        // 2. We need a system or responsible user to authorize the Google API call
        // For simplicity, we find the first responsible user who has an OAuth token
        $integrationUser = \App\Models\User::whereNotNull('gmail_refresh_token')
            ->whereIn('id', $event->responsible_user_ids ?? [])
            ->first();

        if (!$integrationUser) {
            \Log::warning("Cannot sync sale {$sale->id} to Google Sheets: No responsible user with Google OAuth token.");
            return;
        }

        // 3. Initialize Adapter
        $sheetsAdapter = new GoogleSheetsAdapter($integrationUser);

        // 4. Format the row data
        // For example: Timestamp, Purchaser Email, Ticket Type, Variant, Status
        $transaction = $sale->transaction;
        
        $rowData = [
            $sale->created_at->toIso8601String(),
            $transaction->customer_email ?? 'POS Sale',
            $sale->ticket_type ?? 'Standard',
            $sale->variant?->name ?? 'N/A',
            $transaction->status,
        ];

        // 5. Append via Adapter
        $sheetsAdapter->appendRow(
            $event->google_spreadsheet_id,
            $event->google_sheet_name,
            $rowData
        );
    }
}
