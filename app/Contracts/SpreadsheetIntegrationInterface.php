<?php

namespace App\Contracts;

interface SpreadsheetIntegrationInterface
{
    /**
     * Appends a row of data to the specified spreadsheet.
     *
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $sheetName The name of the specific sheet/tab
     * @param array $values A 1D array representing the row values
     * @return bool
     */
    public function appendRow(string $spreadsheetId, string $sheetName, array $values): bool;

    /**
     * Batch appends multiple rows to the specified spreadsheet.
     *
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $sheetName The name of the specific sheet/tab
     * @param array $rows A 2D array representing multiple rows
     * @return bool
     */
    public function appendRows(string $spreadsheetId, string $sheetName, array $rows): bool;
}
