import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, Save, RotateCw } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';


export default function EventAttendees({ event }: { event: any }) {
    const [spreadsheetId, setSpreadsheetId] = React.useState(event.google_spreadsheet_id || '');
    const [sheetName, setSheetName] = React.useState(event.google_sheet_name || '');
    const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
    const [loadingSheets, setLoadingSheets] = React.useState(false);
    
    // Dynamic sheet data: headers and rows
    const [headers, setHeaders] = React.useState<string[]>([]);
    const [rows, setRows] = React.useState<any[][]>([]);

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

    // Force the sidebar to highlight Sellables while on the attendees page
    React.useEffect(() => {
        const prev = document.documentElement.dataset.activeSidebar;
        document.documentElement.dataset.activeSidebar = '/sellables';
        return () => {
            if (prev === undefined) {
                delete document.documentElement.dataset.activeSidebar;
            } else {
                document.documentElement.dataset.activeSidebar = prev;
            }
        };
    }, []);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Sellables', href: '/sellables' },
            { title: 'Events', href: '' },
            { title: event.name, href: '' },
            { title: 'Attendees', href: '' }
        ]}>
            <Head title={`Attendees - ${event.name}`} />

            {/* Force the sidebar to highlight Sellables while on the attendees page */}
            {typeof document !== 'undefined' && (
                (() => {
                    React.useEffect(() => {
                        const prev = document.documentElement.dataset.activeSidebar;
                        document.documentElement.dataset.activeSidebar = '/sellables';
                        return () => {
                            if (prev === undefined) {
                                delete document.documentElement.dataset.activeSidebar;
                            } else {
                                document.documentElement.dataset.activeSidebar = prev;
                            }
                        };
                    }, []);
                    return null;
                })()
            )}

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
                    <CardHeader className="flex items-center justify-between">
                        <div className='flex flex-col'>
                            <CardTitle>Attendees ({rows.length})</CardTitle>
                            <CardDescription>Live data from Google Sheets.</CardDescription>
                        </div>

                        {/* Manage dialog — matches Ticketing page Full Data Source modal */}
                        <div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost">Manage</Button>
                                </DialogTrigger>
                                <DialogContent className="flex h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden p-4 sm:!max-w-[95vw]">
                                    <DialogTitle>Full Data Source</DialogTitle>
                                    <DialogDescription>
                                        <div className="text-xs text-muted-foreground">Total entries: {sampleData.length}</div>
                                    </DialogDescription>

                                    <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                                        <div className="grid h-full min-h-0 grid-cols-3 gap-4">
                                            <div className="col-span-2 min-h-0">
                                                <div className="h-full max-h-[75vh] overflow-y-auto rounded border">
                                                    <table className="w-full table-fixed text-xs">
                                                        <thead>
                                                            <tr>
                                                                {headers.map((f) => (
                                                                    <th key={f} className="sticky top-0 z-10 border-b bg-background/95 pr-2 text-left text-xs backdrop-blur-sm">{f}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {sampleData.map((r, idx) => (
                                                                <tr key={idx} className="border-t">
                                                                    {headers.map((h) => (
                                                                        <td key={h} className="py-1 pr-2 align-top text-xs">
                                                                            <span className="inline-block w-full truncate" title={String(r[h] ?? '')}>{String(r[h] ?? '')}</span>
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            <div className="col-span-1 min-h-0">
                                                <div className="flex h-full max-h-[75vh] flex-col overflow-y-auto rounded-md border bg-background p-4">
                                                    <div className="flex-shrink-0">
                                                        <h4 className="text-sm font-semibold">Recipients summary</h4>
                                                        <p className="mt-1 text-xs text-muted-foreground">Summary of destination domains and potential typos</p>
                                                    </div>

                                                    <div className="mt-3">
                                                        {(() => {
                                                            const emails: string[] = sampleData.map(s => String(s.email ?? '').trim()).filter(Boolean);
                                                            const domains: string[] = emails.map(e => e.includes('@') ? e.split('@')[1].toLowerCase() : '');
                                                            const domainCounts: Record<string, number> = {};
                                                            domains.forEach(d => { if (d) domainCounts[d] = (domainCounts[d] || 0) + 1; });

                                                            const domainEntries = Object.entries(domainCounts).sort((a,b) => b[1] - a[1]);

                                                            if (emails.length === 0) return <div className="text-xs text-muted-foreground">No emails available</div>;

                                                            return (
                                                                <div className="space-y-2 text-xs">
                                                                    <div>Total recipients: <strong>{emails.length}</strong></div>
                                                                    <div className="space-y-1">
                                                                        {domainEntries.map(([d, count]) => (
                                                                            <div key={d} className="flex items-center justify-between">
                                                                                <div className="truncate">{d}</div>
                                                                                <div className="ml-2 text-muted-foreground">{count}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="ghost">Close</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, rowIdx) => (
                                            <TableRow key={rowIdx}>
                                                {row.map((cell, cellIdx) => (
                                                    <TableCell key={cellIdx}>{cell ?? ''}</TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
