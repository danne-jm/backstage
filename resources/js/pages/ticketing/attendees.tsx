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
import { route } from 'ziggy-js';

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
            const res = await axios.get(route('events.sheets', event.id), {
                params: { spreadsheet_id: spreadsheetId }
            });
            
            const sheets = res.data.sheets || [];
            setAvailableSheets(sheets);

            // AUTO-SELECT LOGIC:
            // If we have sheets, and NO sheet is currently selected, pick the first one.
            if (sheets.length > 0 && !sheetName) {
                setSheetName(sheets[0]);
            }

            if (!silent) toast.success('Sheets loaded');
        } catch (e) {
            if (!silent) toast.error('Failed to load sheets. Check ID and Permissions.');
        } finally {
            setLoadingSheets(false);
        }
    };

    const saveConfig = () => {
        router.post(route('events.attendees.config', event.id), {
            google_spreadsheet_id: spreadsheetId,
            google_sheet_name: sheetName
        }, {
            onSuccess: () => toast.success('Configuration saved')
        });
    };

    const syncAttendees = () => {
        setSyncing(true);
        // Ensure we save config first or send params, but typically we rely on saved DB state for sync
        // Ideally, we save the current selection before syncing to be safe
        router.post(route('events.attendees.config', event.id), {
             google_spreadsheet_id: spreadsheetId,
             google_sheet_name: sheetName
        }, {
            onSuccess: () => {
                // Once saved, trigger the sync
                router.post(route('events.attendees.sync', event.id), {}, {
                    onSuccess: () => {
                        toast.success('Attendees synced successfully');
                        setSyncing(false);
                    },
                    onError: () => {
                        toast.error('Sync failed');
                        setSyncing(false);
                    }
                });
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
                                    onChange={(e) => setSheetName(e.target.value)}
                                >
                                    <option value="" disabled>Select a sheet...</option>
                                    {availableSheets.length > 0 ? (
                                        availableSheets.map(s => <option key={s} value={s}>{s}</option>)
                                    ) : (
                                        <option value={sheetName}>{sheetName || 'No sheets found'}</option>
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
