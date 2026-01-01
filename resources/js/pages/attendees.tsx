import { Button } from '@/components/ui/button';
import FullDataDialog from '@/components/FullDataDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, Save, RotateCw, Pencil } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { type SharedData } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';


export default function EventAttendees({ event }: { event: any }) {
    const [spreadsheetId, setSpreadsheetId] = React.useState(event.google_spreadsheet_id || '');
    const [sheetName, setSheetName] = React.useState(event.google_sheet_name || '');
    const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
    const [loadingSheets, setLoadingSheets] = React.useState(false);

    // Dynamic sheet data: headers and rows
    const [headers, setHeaders] = React.useState<string[]>([]);
    const [rows, setRows] = React.useState<any[][]>([]);

    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.permissions || [];
    const canUpdateAttendee = permissions.includes('admin') || permissions.includes('update_event_attendee');

    const [editingRowIndex, setEditingRowIndex] = React.useState<number | null>(null);
    const [editingRowData, setEditingRowData] = React.useState<string[]>([]);
    const [savingRow, setSavingRow] = React.useState(false);

    // Derived sample data (array of objects) for easier rendering in the Manage dialog
    const sampleData = React.useMemo(() => {
        if (!headers || headers.length === 0 || !rows || rows.length === 0) return [];
        return rows.map((r) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, idx) => {
                obj[h] = r[idx] ?? '';
            });
            return obj;
        });
    }, [headers, rows]);

    // Helper to fetch sheets (reusable)
    const fetchSheets = async (silent = false) => {
        if (!spreadsheetId) return;
        setLoadingSheets(true);
        try {
            // Use direct URL instead of route()
            const res = await axios.get(`/sellables/events/${event.id}/sheets`, {
                params: { spreadsheet_id: spreadsheetId }
            });
            // Validate response
            if (res.data && Array.isArray(res.data.sheets)) {
                setAvailableSheets(res.data.sheets);

                // If no sheets found, clear the sheet name in state and database
                if (res.data.sheets.length === 0) {
                    setSheetName('');
                    // Clear the sheet name in database
                    router.post(`/sellables/events/${event.id}/attendees/config`, {
                        google_spreadsheet_id: spreadsheetId,
                        google_sheet_name: ''
                    }, {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            if (!silent) toast.error('No sheets found in spreadsheet');
                        }
                    });
                } else {
                    // Determine which sheet to use
                    let selectedSheet: string;

                    // If current sheetName is still in the available sheets, keep it
                    if (sheetName && res.data.sheets.includes(sheetName)) {
                        selectedSheet = sheetName;
                    } else {
                        // Otherwise, use the first available sheet and update state
                        selectedSheet = res.data.sheets[0];
                        setSheetName(selectedSheet);

                        // Update database with the new sheet name
                        router.post(`/sellables/events/${event.id}/attendees/config`, {
                            google_spreadsheet_id: spreadsheetId,
                            google_sheet_name: selectedSheet
                        }, {
                            preserveState: true,
                            preserveScroll: true
                        });
                    }

                    if (!silent) {
                        toast.success('Sheets loaded');
                    }

                    // Fetch and log sheet data with the correct sheet name
                    fetchSheetData(selectedSheet);
                }
            } else {
                throw new Error("Invalid response format from server");
            }
        } catch (e) {
            console.error(e);
            let msg = "Unknown error";
            if (typeof e === 'object' && e !== null) {
                // @ts-ignore
                msg = e.response?.data?.error || e.message || msg;
            }
            // Clear state and database on error
            setAvailableSheets([]);
            setSheetName('');
            router.post(`/sellables/events/${event.id}/attendees/config`, {
                google_spreadsheet_id: spreadsheetId,
                google_sheet_name: ''
            }, {
                preserveState: true,
                preserveScroll: true
            });
            if (!silent) toast.error(`Failed to load sheets: ${msg}`);
        } finally {
            setLoadingSheets(false);
        }
    };

    // Fetch and display sheet data dynamically (no parsing rules)
    const fetchSheetData = async (selectedSheet: string) => {
        try {
            const res = await axios.get(`/sellables/events/${event.id}/sheet-data`, {
                params: {
                    spreadsheet_id: spreadsheetId,
                    sheet_name: selectedSheet,
                },
            });

            console.log('Sheet Data:', res.data);

            // Display all columns dynamically in the order they appear
            if (res.data && Array.isArray(res.data.rows) && res.data.rows.length > 0) {
                const sheetRows: any[][] = res.data.rows;
                const sheetHeaders = sheetRows[0]; // First row is headers
                const dataRows = sheetRows.slice(1); // Rest are data

                setHeaders(sheetHeaders);
                setRows(dataRows);
            } else {
                setHeaders([]);
                setRows([]);
            }
        } catch (e) {
            console.error('Failed to fetch sheet data:', e);
            setHeaders([]);
            setRows([]);
        }
    };

    const saveConfig = () => {
        router.post(
            `/sellables/events/${event.id}/attendees/config`,
            {
                google_spreadsheet_id: spreadsheetId,
                google_sheet_name: sheetName,
            },
            {
                onSuccess: () => {
                    toast.success('Configuration saved. Fetching attendees...');

                    // Refresh sheet list and fetch the selected sheet data so the table updates immediately
                    fetchSheets(true).then(() => {
                        if (sheetName) {
                            fetchSheetData(sheetName);
                        } else if (availableSheets.length > 0) {
                            // if sheetName was updated by fetchSheets, use the first available
                            fetchSheetData(availableSheets[0]);
                        }
                    });
                },
            },
        );
    };

    // AUTO-TRIGGER ON LOAD
    React.useEffect(() => {
        if (spreadsheetId) {
            // Pass 'true' to silence the initial success toast (optional preference)
            fetchSheets(true);
        }
    }, []); // Run once on mount



    return (
        <AppLayout breadcrumbs={[
            { title: 'Sellables', href: '/sellables' },
            { title: 'Events', href: '' },
            { title: event.name, href: '' },
            { title: 'Attendees', href: '' }
        ]}>
            <Head title={`Attendees - ${event.name}`} />



            <div className="flex h-full flex-col gap-6 p-6">

                {/* Configuration Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Google Sheets Configuration</CardTitle>
                        <CardDescription>Link a spreadsheet to automatically import attendees.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Spreadsheet ID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={spreadsheetId}
                                        onChange={(e) => setSpreadsheetId(e.target.value)}
                                        placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBkJ..."
                                    />
                                    <Button variant="outline" size="icon" onClick={() => fetchSheets(false)} disabled={loadingSheets}>
                                        {loadingSheets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Copy the ID from the URL of your Google Sheet.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Sheet Name</Label>
                                <select
                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    value={sheetName}
                                    onChange={(e) => {
                                        const newSheet = e.target.value;
                                        setSheetName(newSheet);
                                        if (newSheet) {
                                            fetchSheetData(newSheet);
                                        }
                                    }}
                                >
                                    {availableSheets.length > 0 ? (
                                        <>
                                            <option value="" disabled>Select a sheet...</option>
                                            {availableSheets.map(s => <option key={s} value={s}>{s}</option>)}
                                        </>
                                    ) : (
                                        <option value="">No sheets found</option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end items-center pt-2">
                            <Button onClick={saveConfig} variant="secondary">
                                <Save className="mr-2 h-4 w-4" /> Save & Reload
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendees Table - Dynamic columns */}
                <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div className="flex flex-col items-start">
                            <CardTitle className="mb-1">Attendees ({rows.length})</CardTitle>
                            <CardDescription>Live data from Google Sheets.</CardDescription>
                        </div>
                        <div className="flex items-center">
                            {/* Open full-data view in a fullscreen modal; label changed from 'Manage' to 'Fullscreen' */}
                            <FullDataDialog title="Full Attendee Data" triggerLabel="Fullscreen" fields={headers} sampleData={sampleData} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {headers.length === 0 || rows.length === 0 ? (
                            <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                                {event.google_spreadsheet_id && event.google_sheet_name
                                    ? 'No data found in the configured spreadsheet.'
                                    : 'No spreadsheet configured. Configure a Google Sheet above and save.'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {headers.map((header, idx) => (
                                                <TableHead key={idx}>{header}</TableHead>
                                            ))}
                                            {canUpdateAttendee && <TableHead className="w-[50px]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, rowIdx) => (
                                            <TableRow key={rowIdx}>
                                                {row.map((cell, cellIdx) => (
                                                    <TableCell key={cellIdx}>{cell ?? ''}</TableCell>
                                                ))}
                                                {canUpdateAttendee && (
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => {
                                                                setEditingRowIndex(rowIdx);
                                                                setEditingRowData([...row]);
                                                            }}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={editingRowIndex !== null} onOpenChange={(open) => !open && setEditingRowIndex(null)}>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Attendee</DialogTitle>
                        <DialogDescription>
                            Update details for row {editingRowIndex !== null ? editingRowIndex + 2 : ''}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {headers.map((header, idx) => (
                            <div key={idx} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={`col-${idx}`} className="text-right">
                                    {header}
                                </Label>
                                <Input
                                    id={`col-${idx}`}
                                    value={editingRowData[idx] ?? ''}
                                    onChange={(e) => {
                                        const newData = [...editingRowData];
                                        newData[idx] = e.target.value;
                                        setEditingRowData(newData);
                                    }}
                                    className="col-span-3"
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingRowIndex(null)} disabled={savingRow}>
                            Cancel
                        </Button>
                        <Button
                            onClick={async () => {
                                if (editingRowIndex === null) return;
                                setSavingRow(true);
                                try {
                                    // Row index 0 in `rows` is actually Row 2 in sheet (after header)
                                    // Make sure range covers the whole row. "SheetName!A{row}:ZZ{row}"
                                    // We can just use "SheetName!A{row}" and Google Sheets will update cells starting there.
                                    const sheetRowNumber = editingRowIndex + 2;
                                    const range = `${sheetName}!A${sheetRowNumber}`;

                                    await axios.post(`/sellables/events/${event.id}/attendees/update`, {
                                        spreadsheet_id: spreadsheetId,
                                        range: range,
                                        values: editingRowData
                                    });

                                    toast.success('Attendee updated successfully');
                                    setEditingRowIndex(null);
                                    // Refresh data
                                    fetchSheetData(sheetName);
                                } catch (e) {
                                    console.error(e);
                                    toast.error('Failed to update attendee');
                                } finally {
                                    setSavingRow(false);
                                }
                            }}
                            disabled={savingRow}
                        >
                            {savingRow && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
