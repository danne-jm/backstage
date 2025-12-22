import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';


export default function EventAttendees({ event, attendees }: { event: any, attendees: any[] }) {
    const [spreadsheetId, setSpreadsheetId] = React.useState(event.google_spreadsheet_id || '');
    const [sheetName, setSheetName] = React.useState(event.google_sheet_name || '');
    const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
    const [loadingSheets, setLoadingSheets] = React.useState(false);
    const [syncing, setSyncing] = React.useState(false);

    // Helper to fetch sheets (reusable)
    const fetchSheets = async (silent = false) => {
        if (!spreadsheetId) return;
        setLoadingSheets(true);
        try {
            // Use direct URL instead of route()
            const res = await axios.get(`/ticketing/events/${event.id}/sheets`, {
                params: { spreadsheet_id: spreadsheetId }
            });
            // Validate response
            if (res.data && Array.isArray(res.data.sheets)) {
                setAvailableSheets(res.data.sheets);
                
                // If no sheets found, clear the sheet name in state and database
                if (res.data.sheets.length === 0) {
                    setSheetName('');
                    // Clear the sheet name in database
                    router.post(`/ticketing/events/${event.id}/attendees/config`, {
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
                        router.post(`/ticketing/events/${event.id}/attendees/config`, {
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
            router.post(`/ticketing/events/${event.id}/attendees/config`, {
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

    // Fetch and log sheet data
    const fetchSheetData = async (selectedSheet: string) => {
        try {
            const res = await axios.get(`/ticketing/events/${event.id}/sheet-data`, {
                params: { 
                    spreadsheet_id: spreadsheetId,
                    sheet_name: selectedSheet
                }
            });
            console.log('Sheet Data:', res.data);
        } catch (e) {
            console.error('Failed to fetch sheet data:', e);
        }
    };

    const saveConfig = () => {
        router.post(`/ticketing/events/${event.id}/attendees/config`, {
            google_spreadsheet_id: spreadsheetId,
            google_sheet_name: sheetName
        }, {
            onSuccess: () => toast.success('Configuration saved')
        });
    };

    const syncAttendees = () => {
        setSyncing(true);
        // Save first, then Sync
        router.post(`/ticketing/events/${event.id}/attendees/config`, {
             google_spreadsheet_id: spreadsheetId,
             google_sheet_name: sheetName
        }, {
            onSuccess: () => {
                // Now trigger sync
                router.post(`/ticketing/events/${event.id}/attendees/sync`, {}, {
                    onSuccess: () => {
                        toast.success('Sync started/completed');
                        setSyncing(false); // Stop spinner
                    },
                    onError: (errors) => {
                        console.error(errors);
                        toast.error('Sync failed. Check logs.');
                        setSyncing(false); // Stop spinner on error
                    },
                    onFinish: () => setSyncing(false) // Safety net
                });
            },
            onError: () => {
                toast.error('Failed to save configuration');
                setSyncing(false);
            }
        });
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
            { title: 'Ticketing', href: '/ticketing' },
            { title: 'Events', href: '/sellables' },
            { title: event.name, href: '#' },
            { title: 'Attendees', href: '#' }
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
                                        {loadingSheets ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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
                        <div className="flex justify-between items-center pt-2">
                            <Button onClick={saveConfig} variant="secondary">
                                <Save className="mr-2 h-4 w-4" /> Save Configuration
                            </Button>
                            
                            <Button onClick={syncAttendees} disabled={syncing || !spreadsheetId} variant="default">
                                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Sync Attendees Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendees Table */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Attendees ({attendees.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>First Name</TableHead>
                                    <TableHead>Last Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Registered</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No attendees found. Configure a spreadsheet and sync.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendees.map((att: any) => (
                                        <TableRow key={att.id}>
                                            <TableCell>{att.first_name}</TableCell>
                                            <TableCell>{att.last_name}</TableCell>
                                            <TableCell>{att.email}</TableCell>
                                            <TableCell>{new Date(att.created_at).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
