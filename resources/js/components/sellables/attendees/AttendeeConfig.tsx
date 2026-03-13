import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RotateCw, Save } from 'lucide-react';

interface AttendeeConfigProps {
    eventId: number;
    spreadsheetId: string;
    setSpreadsheetId: (id: string) => void;
    sheetName: string;
    setSheetName: (name: string) => void;
    availableSheets: string[];
    setAvailableSheets: (sheets: string[]) => void;
    loadingSheets: boolean;
    setLoadingSheets: (loading: boolean) => void;
    onSheetsLoaded?: (sheets: string[]) => void;
    saveConfig: () => void;
    onError?: (msg: string) => void;
}

/**
 * Extract spreadsheet ID from a Google Sheets URL or return the raw value.
 * Supports: https://docs.google.com/spreadsheets/d/<ID>/edit...
 */
function extractSpreadsheetId(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : trimmed;
}

export function AttendeeConfig({
    eventId,
    spreadsheetId,
    setSpreadsheetId,
    sheetName,
    setSheetName,
    availableSheets,
    setAvailableSheets,
    loadingSheets,
    setLoadingSheets,
    onSheetsLoaded,
    saveConfig,
    onError,
}: AttendeeConfigProps) {
    const [rawInput, setRawInput] = React.useState(spreadsheetId);

    // Keep rawInput synced when spreadsheetId is set externally (e.g. from initial props)
    React.useEffect(() => {
        setRawInput(spreadsheetId);
        if (spreadsheetId) {
            fetchSheets();
        }
    }, []);

    const handleInputChange = (value: string) => {
        setRawInput(value);
        const extracted = extractSpreadsheetId(value);
        setSpreadsheetId(extracted);
    };

    const fetchSheets = async () => {
        const id = extractSpreadsheetId(rawInput);
        if (!id) return;
        setLoadingSheets(true);
        try {
            const res = await fetch(
                `/sellables/events/${eventId}/sheets?spreadsheet_id=${encodeURIComponent(id)}`,
                { headers: { Accept: 'application/json' } }
            );
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setAvailableSheets(data.sheets ?? []);
            onSheetsLoaded?.(data.sheets ?? []);
        } catch (e: any) {
            onError?.(`Failed to load sheets: ${e.message}`);
        } finally {
            setLoadingSheets(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Google Sheets Configuration</CardTitle>
                <CardDescription>
                    Paste a spreadsheet ID or full Google Sheets URL to import attendees.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Spreadsheet URL or ID</Label>
                        <div className="flex gap-2">
                            <Input
                                value={rawInput}
                                onChange={(e) => handleInputChange(e.target.value)}
                                placeholder="https://docs.google.com/spreadsheets/d/... or ID"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={fetchSheets}
                                disabled={loadingSheets || !rawInput.trim()}
                                title="Load sheets"
                            >
                                {loadingSheets ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RotateCw className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {/* Show the extracted ID as helper text when URL is pasted */}
                        {rawInput !== spreadsheetId && spreadsheetId && (
                            <p className="text-xs text-muted-foreground">
                                Extracted ID: <code className="font-mono">{spreadsheetId}</code>
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Sheet</Label>
                        {availableSheets.length === 0 ? (
                            <p className="text-sm text-muted-foreground pt-2">
                                Enter a spreadsheet and click <RotateCw className="inline h-3 w-3 mx-1" /> to load sheets.
                            </p>
                        ) : (
                            <select
                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                value={sheetName}
                                onChange={(e) => setSheetName(e.target.value)}
                            >
                                <option value="" disabled>Select a sheet…</option>
                                {availableSheets.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-end pt-2">
                    <Button onClick={saveConfig} variant="secondary" disabled={!spreadsheetId || !sheetName}>
                        <Save className="mr-2 h-4 w-4" /> Save &amp; Reload
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
