import FullDataDialog from '@/components/FullDataDialog';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Filter,
    Loader2,
    Plus,
    RotateCw,
    Save,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export default function EventAttendees({ event }: { event: any }) {
    const [spreadsheetId, setSpreadsheetId] = React.useState(
        event.google_spreadsheet_id || '',
    );
    const [sheetName, setSheetName] = React.useState(
        event.google_sheet_name || '',
    );
    const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
    const [loadingSheets, setLoadingSheets] = React.useState(false);

    // Dynamic sheet data: headers and rows
    const [headers, setHeaders] = React.useState<string[]>([]);
    const [rows, setRows] = React.useState<any[][]>([]);

    const { auth } = usePage<SharedData>().props;



    // Derived sample data (array of objects) for easier rendering in the Manage dialog
    const sampleData = React.useMemo(() => {
        if (!headers || headers.length === 0 || !rows || rows.length === 0)
            return [];
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
            const res = await axios.get(
                `/sellables/events/${event.id}/sheets`,
                {
                    params: { spreadsheet_id: spreadsheetId },
                },
            );
            // Validate response
            if (res.data && Array.isArray(res.data.sheets)) {
                setAvailableSheets(res.data.sheets);

                // If no sheets found, clear the sheet name in state and database
                if (res.data.sheets.length === 0) {
                    setSheetName('');
                    // Clear the sheet name in database
                    router.post(
                        `/sellables/events/${event.id}/attendees/config`,
                        {
                            google_spreadsheet_id: spreadsheetId,
                            google_sheet_name: '',
                        },
                        {
                            preserveState: true,
                            preserveScroll: true,
                            onSuccess: () => {
                                if (!silent)
                                    toast.error(
                                        'No sheets found in spreadsheet',
                                    );
                            },
                        },
                    );
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
                        router.post(
                            `/sellables/events/${event.id}/attendees/config`,
                            {
                                google_spreadsheet_id: spreadsheetId,
                                google_sheet_name: selectedSheet,
                            },
                            {
                                preserveState: true,
                                preserveScroll: true,
                            },
                        );
                    }

                    if (!silent) {
                        toast.success('Sheets loaded');
                    }

                    // Fetch and log sheet data with the correct sheet name
                    fetchSheetData(selectedSheet);
                }
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (e) {
            console.error(e);
            let msg = 'Unknown error';
            if (typeof e === 'object' && e !== null) {
                // @ts-expect-error -- axios error typing
                msg = e.response?.data?.error || e.message || msg;
            }
            // Clear state and database on error
            setAvailableSheets([]);
            setSheetName('');
            router.post(
                `/sellables/events/${event.id}/attendees/config`,
                {
                    google_spreadsheet_id: spreadsheetId,
                    google_sheet_name: '',
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
            if (!silent) toast.error(`Failed to load sheets: ${msg}`);
        } finally {
            setLoadingSheets(false);
        }
    };

    // Fetch and display sheet data dynamically (no parsing rules)
    const fetchSheetData = async (selectedSheet: string) => {
        try {
            const res = await axios.get(
                `/sellables/events/${event.id}/sheet-data`,
                {
                    params: {
                        spreadsheet_id: spreadsheetId,
                        sheet_name: selectedSheet,
                    },
                },
            );

            console.log('Sheet Data:', res.data);

            // Display all columns dynamically in the order they appear
            if (
                res.data &&
                Array.isArray(res.data.rows) &&
                res.data.rows.length > 0
            ) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // Filter Config State
    const [filterConfig, setFilterConfig] = React.useState<any[]>(
        event.attendee_filter_config || [],
    );
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const saveFilterConfig = () => {
        router.post(
            `/sellables/events/${event.id}/attendees/filter`,
            { filter_config: filterConfig },
            {
                onSuccess: () => {
                    toast.success('Filter configuration saved');
                    setIsFilterOpen(false);
                    // Refresh data immediately
                    if (sheetName) {
                        fetchSheetData(sheetName);
                    }
                },
                onError: () => toast.error('Failed to save filter'),
            },
        );
    };

    const addFilterRule = () => {
        setFilterConfig([
            ...filterConfig,
            { column: '', operator: 'equals', value: '' },
        ]);
    };

    const removeFilterRule = (index: number) => {
        setFilterConfig(filterConfig.filter((_, i) => i !== index));
    };

    const updateFilterRule = (index: number, field: string, value: string) => {
        const newConfig = [...filterConfig];
        newConfig[index] = { ...newConfig[index], [field]: value };
        setFilterConfig(newConfig);
    };

    // Google connection warning
    const [showGoogleWarning, setShowGoogleWarning] = React.useState(false);
    // Explicitly cast to any or check property existence as SharedData might differ
    const gmailConnected = Boolean((auth.user as any)?.gmail_connected);

    React.useEffect(() => {
        if (!gmailConnected) {
            setShowGoogleWarning(true);
            const timer = setTimeout(() => setShowGoogleWarning(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [gmailConnected]);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Sellables', href: '/sellables' },
                { title: 'Events', href: '' },
                { title: event.name, href: '' },
                { title: 'Attendees', href: '' },
            ]}
        >
            <Head title={`Attendees - ${event.name}`} />

            <div className="relative flex h-full flex-col gap-6 p-6">
                {/* Google Connection Warning */}
                {showGoogleWarning && (
                    <div className="fixed top-14 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                        <Alert
                            variant="destructive"
                            className="border-red-200 bg-red-100 text-red-900 dark:border-red-900 dark:bg-red-900/30 dark:text-red-200"
                        >
                            <TriangleAlert className="h-4 w-4" />
                            <AlertTitle>
                                Google account not connected — you cannot sync
                                attendees
                            </AlertTitle>
                        </Alert>
                    </div>
                )}

                {/* Configuration Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Google Sheets Configuration</CardTitle>
                        <CardDescription>
                            Link a spreadsheet to automatically import
                            attendees.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Spreadsheet ID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={spreadsheetId}
                                        onChange={(e) =>
                                            setSpreadsheetId(e.target.value)
                                        }
                                        placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBkJ..."
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => fetchSheets(false)}
                                        disabled={loadingSheets}
                                    >
                                        {loadingSheets ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RotateCw className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Copy the ID from the URL of your Google
                                    Sheet.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Sheet Name</Label>
                                <select
                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                                            <option value="" disabled>
                                                Select a sheet...
                                            </option>
                                            {availableSheets.map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </>
                                    ) : (
                                        <option value="">
                                            No sheets found
                                        </option>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-end pt-2">
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
                            <CardTitle className="mb-1">
                                Attendees ({rows.length})
                            </CardTitle>
                            <CardDescription>
                                Live data from Google Sheets.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setIsFilterOpen(true)}
                                className="relative"
                            >
                                <Filter className="h-4 w-4" />
                                {filterConfig.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                        {filterConfig.length}
                                    </span>
                                )}
                            </Button>
                            {/* Open full-data view in a fullscreen modal; label changed from 'Manage' to 'Fullscreen' */}
                            <FullDataDialog
                                title="Full Attendee Data"
                                triggerLabel="Fullscreen"
                                fields={headers}
                                sampleData={sampleData}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {headers.length === 0 || rows.length === 0 ? (
                            <div className="flex h-24 items-center justify-center text-center text-muted-foreground">
                                {event.google_spreadsheet_id &&
                                    event.google_sheet_name
                                    ? 'No data found in the configured spreadsheet.'
                                    : 'No spreadsheet configured. Configure a Google Sheet above and save.'}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {headers.map((header, idx) => (
                                                <TableHead key={idx}>
                                                    {header}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, rowIdx) => (
                                            <TableRow key={rowIdx}>
                                                {row.map((cell, cellIdx) => (
                                                    <TableCell key={cellIdx}>
                                                        {cell ?? ''}
                                                    </TableCell>
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

            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Filter Configuration</DialogTitle>
                        <DialogDescription>
                            Define rules for identifying valid attendees. Only
                            attendees matching ALL rules will receive emails.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {filterConfig.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground">
                                No filter rules set. All attendees will be
                                imported.
                            </div>
                        )}
                        {filterConfig.map((rule, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <div className="grid flex-1 grid-cols-3 gap-2">
                                    <select
                                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={rule.column}
                                        onChange={(e) =>
                                            updateFilterRule(
                                                idx,
                                                'column',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="" disabled>
                                            Select Column
                                        </option>
                                        {headers.map((h) => (
                                            <option key={h} value={h}>
                                                {h}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                        value={rule.operator}
                                        onChange={(e) =>
                                            updateFilterRule(
                                                idx,
                                                'operator',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="equals">Equals</option>
                                        <option value="contains">
                                            Contains
                                        </option>
                                        <option value="not_contains">
                                            Does not contain
                                        </option>
                                        <option value="is_checked">
                                            Is Checked
                                        </option>
                                        <option value="is_not_checked">
                                            Is Not Checked
                                        </option>
                                        <option value="is_empty">
                                            Is Empty
                                        </option>
                                        <option value="is_not_empty">
                                            Is Not Empty
                                        </option>
                                    </select>

                                    {![
                                        'is_checked',
                                        'is_not_checked',
                                        'is_empty',
                                        'is_not_empty',
                                    ].includes(rule.operator) && (
                                            <Input
                                                placeholder="Value..."
                                                value={rule.value}
                                                onChange={(e) =>
                                                    updateFilterRule(
                                                        idx,
                                                        'value',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFilterRule(idx)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={addFilterRule}
                            className="w-full border-dashed"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Rule
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="secondary"
                            onClick={() => setIsFilterOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={saveFilterConfig}>
                            Save Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
