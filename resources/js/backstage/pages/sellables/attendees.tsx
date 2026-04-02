import AppLayout from '@backstage/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import * as React from 'react';
// No toast import needed, using local showToast
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@backstage/components/ui/card';
import { TriangleAlert, Database, Loader2, CheckCircle2, MailCheck } from 'lucide-react';
import { Alert, AlertTitle } from '@backstage/components/ui/alert';
import { Button } from '@backstage/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@backstage/components/ui/dialog';

import { AttendeeConfig } from '@backstage/components/sellables/attendees/AttendeeConfig';
import { AttendeeTable } from '@backstage/components/sellables/attendees/AttendeeTable';
import { AttendeeFilterDialog } from '@backstage/components/sellables/attendees/AttendeeFilterDialog';
import { AttendeeActions } from '@backstage/components/sellables/attendees/AttendeeActions';
import { RecipientSummary } from '@backstage/components/email-distributor/recipient-summary';

export default function EventAttendees({ event }: { event: any }) {
    const { auth } = usePage().props as any;

    // State
    const [spreadsheetId, setSpreadsheetId] = React.useState(event.google_spreadsheet_id || '');
    const [sheetName, setSheetName] = React.useState(event.google_sheet_name || '');
    const [availableSheets, setAvailableSheets] = React.useState<string[]>([]);
    const [loadingSheets, setLoadingSheets] = React.useState(false);
    const [headers, setHeaders] = React.useState<string[]>([]);
    const [rows, setRows] = React.useState<any[][]>([]);
    const [allRows, setAllRows] = React.useState<any[][]>([]);
    const [filterConfig, setFilterConfig] = React.useState<any[]>(event.attendee_filter_config || []);
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [isFullDataOpen, setIsFullDataOpen] = React.useState(false);
    const [validationResults, setValidationResults] = React.useState<Record<number, boolean | null>>({});
    const [emailVerificationResults, setEmailVerificationResults] = React.useState<Record<number, { valid: boolean; reason: string }>>({});
    const [isValidating, setIsValidating] = React.useState(false);
    const [isVerifyingEmails, setIsVerifyingEmails] = React.useState(false);
    const [googleTokenExpired, setGoogleTokenExpired] = React.useState(false);
    const [message, setMessage] = React.useState<string | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    const gmailConnected = Boolean(auth.user?.gmail_refresh_token);

    // Auto-load data after a sheet is selected via the config component
    const handleSheetsLoaded = (sheets: string[]) => {
        if (sheets.length > 0) {
            const preferred = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
            setSheetName(preferred);
            fetchSheetData(preferred);
        }
    };

    // Initial load — if event already has a sheet configured, fetch its data directly
    React.useEffect(() => {
        if (spreadsheetId && sheetName) {
            fetchSheetData(sheetName);
        }
    }, []);

    const fetchSheetData = async (selectedSheet: string) => {
        try {
            const [filteredRes, unfilteredRes] = await Promise.all([
                axios.get(`/sellables/events/${event.id}/sheet-data`, {
                    params: { sheet_name: selectedSheet }
                }),
                axios.get(`/sellables/events/${event.id}/sheet-data`, {
                    params: { sheet_name: selectedSheet, unfiltered: true }
                })
            ]);

            if (filteredRes.data && filteredRes.data.rows) {
                setHeaders(filteredRes.data.rows[0] || []);
                setRows(filteredRes.data.rows.slice(1) || []);
            }
            if (unfilteredRes.data && unfilteredRes.data.rows) {
                setAllRows(unfilteredRes.data.rows || []);
            }
        } catch (e: any) {
            showToast(`Failed to load sheet data: ${e.response?.data?.error || e.message}`, 'error');
        }
    };

    const saveConfig = () => {
        router.post(`/sellables/events/${event.id}/attendees/config`, {
            google_spreadsheet_id: spreadsheetId,
            google_sheet_name: sheetName,
        }, {
            onSuccess: () => {
                showToast('Configuration saved');
                if (sheetName) fetchSheetData(sheetName);
            }
        });
    };

    const saveFilterConfig = (draft: any[]) => {
        router.post(`/sellables/events/${event.id}/attendees/filter`, {
            filter_config: draft
        }, {
            onSuccess: () => {
                showToast('Filter saved');
                setIsFilterOpen(false);
                setFilterConfig(draft);
                if (sheetName) fetchSheetData(sheetName);
            }
        });
    };

    const validatePurchases = async () => {
        setIsValidating(true);
        try {
            const res = await axios.post(`/sellables/events/${event.id}/attendees/validate-purchases`);
            showToast(`Validated ${res.data.total_checked} entries. ${res.data.valid_count} valid.`);
            if (sheetName) fetchSheetData(sheetName);
        } catch (e: any) {
            showToast(`Validation failed: ${e.response?.data?.error || e.message}`);
        } finally {
            setIsValidating(false);
        }
    };

    const verifyEmails = async () => {
        setIsVerifyingEmails(true);
        // Clear previous email results when re-running
        setEmailVerificationResults({});
        try {
            const res = await axios.post(`/sellables/events/${event.id}/attendees/verify-emails`);
            showToast(`Checked ${res.data.total_checked} emails. ${res.data.valid_count} valid.`);
            // Backend returns results keyed by 1-based sheet row index (0 is the header row).
            // The table renders rows starting from index 0, so we subtract 1.
            if (res.data.results) {
                const remapped: Record<number, { valid: boolean; reason: string }> = {};
                for (const [key, value] of Object.entries(res.data.results)) {
                    remapped[Number(key) - 1] = value as { valid: boolean; reason: string };
                }
                setEmailVerificationResults(remapped);
            }
            // No need to reload from sheets — we colorize in-page
        } catch (e: any) {
            showToast(`Verification failed: ${e.response?.data?.error || e.message}`);
        } finally {
            setIsVerifyingEmails(false);
        }
    };

    const purchaseIdColIndex = React.useMemo(() =>
        headers.findIndex(h => h.toLowerCase().includes('purchase_identifier')),
        [headers]);

    const emailColIndex = React.useMemo(() =>
        headers.findIndex(h => h.toLowerCase() === 'email'),
        [headers]);

    const allData = React.useMemo(() => {
        if (allRows.length < 2) return [];
        const headerRow = allRows[0];
        const dataRows = allRows.slice(1);
        return dataRows.map(row => {
            const obj: any = {};
            headerRow.forEach((h, i) => {
                obj[h] = row[i];
            });
            return obj;
        });
    }, [allRows]);

    const verificationActions = (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={validatePurchases}
                disabled={isValidating || purchaseIdColIndex === -1 || allData.length === 0}
                className="w-full text-xs"
            >
                {isValidating ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                    <CheckCircle2 className="mr-2 h-3 w-3" />
                )}
                Verify Payments
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={verifyEmails}
                disabled={isVerifyingEmails || emailColIndex === -1 || allData.length === 0}
                className="w-full text-xs"
            >
                {isVerifyingEmails ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                    <MailCheck className="mr-2 h-3 w-3" />
                )}
                Verify Domains
            </Button>
        </>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Sellables', href: '/sellables' },
                { title: event.name, href: '#' },
                { title: 'Attendees', href: '#' },
            ]}
        >
            <Head title={`Attendees - ${event.name}`} />

            <div className="flex h-full flex-col gap-6 p-6">
                {message && (
                    <div className="fixed top-4 left-1/2 z-50 w-[min(90%,40rem)] -translate-x-1/2 transform">
                        <Alert className="bg-background border-primary">
                            <AlertTitle>{message}</AlertTitle>
                        </Alert>
                    </div>
                )}

                {!gmailConnected && (
                    <Alert variant="destructive">
                        <TriangleAlert className="h-4 w-4" />
                        <AlertTitle>Google account not connected. Please connect in settings.</AlertTitle>
                    </Alert>
                )}

                {googleTokenExpired && (
                    <Alert variant="destructive">
                        <TriangleAlert className="h-4 w-4" />
                        <AlertTitle>Google connection expired.</AlertTitle>
                        <Button variant="link" onClick={() => window.location.reload()}>Refresh</Button>
                    </Alert>
                )}

                <AttendeeConfig
                    eventId={event.id}
                    spreadsheetId={spreadsheetId}
                    setSpreadsheetId={setSpreadsheetId}
                    sheetName={sheetName}
                    setSheetName={setSheetName}
                    availableSheets={availableSheets}
                    setAvailableSheets={setAvailableSheets}
                    loadingSheets={loadingSheets}
                    setLoadingSheets={setLoadingSheets}
                    onSheetsLoaded={handleSheetsLoaded}
                    onError={(msg) => showToast(msg)}
                    saveConfig={saveConfig}
                />

                <Card className="flex-1 overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <CardTitle>Attendees ({rows.length})</CardTitle>
                                <CardDescription>Live data from Google Sheets.</CardDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsFullDataOpen(true)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <Database className="mr-2 h-4 w-4" />
                                Full Data Source
                            </Button>
                        </div>
                        <AttendeeActions
                            isValidating={isValidating}
                            validatePurchases={validatePurchases}
                            isVerifyingEmails={isVerifyingEmails}
                            verifyEmails={verifyEmails}
                            setIsFilterOpen={setIsFilterOpen}
                            filterCount={filterConfig.length}
                            hasData={rows.length > 0}
                            hasPurchaseIdCol={purchaseIdColIndex !== -1}
                            hasEmailCol={emailColIndex !== -1}
                        />
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <AttendeeTable
                            headers={headers}
                            rows={rows}
                            purchaseIdentifierColIndex={purchaseIdColIndex}
                            validationResults={validationResults}
                            emailColIndex={emailColIndex}
                            emailVerificationResults={emailVerificationResults}
                        />
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isFullDataOpen} onOpenChange={setIsFullDataOpen}>
                <DialogContent className="flex h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden p-4 sm:!max-w-[95vw]">
                    <DialogHeader>
                        <DialogTitle>Full Data Source</DialogTitle>
                        <DialogDescription>
                            Total unfiltered entries: {allData.length}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 min-h-0 flex-1 overflow-hidden">
                        <div className="grid h-full min-h-0 grid-cols-3 gap-4">
                            {/* Full data table */}
                            <div className="col-span-2 min-h-0">
                                <div className="h-full max-h-[75vh] overflow-y-auto rounded border">
                                    <table className="w-full table-fixed text-xs">
                                        <thead>
                                            <tr>
                                                {(allRows[0] || []).map((field: string) => (
                                                    <th
                                                        key={field}
                                                        className="sticky top-0 z-10 border-b bg-background/95 pr-2 text-left text-xs backdrop-blur-sm truncate max-w-[150px]"
                                                        title={field}
                                                    >
                                                        {field}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allData.map((row, idx) => {
                                                const rowIdx = idx + 1; // 1-based index for results
                                                const res = emailVerificationResults[rowIdx];
                                                const bgColor = res && res.valid === false ? 'bg-red-100/30' : '';
                                                return (
                                                    <tr key={idx} className={`border-t hover:bg-muted/50 ${bgColor}`}>
                                                        {(allRows[0] || []).map((field: string) => (
                                                            <td key={field} className="py-1 pr-2 align-top text-xs truncate max-w-[150px]" title={String(row[field] ?? '')}>
                                                                {String(row[field] ?? '')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recipient summary */}
                            <div className="col-span-1 min-h-0">
                                <RecipientSummary
                                    data={allData}
                                    emailField={headers[emailColIndex] || 'email'}
                                    actions={verificationActions}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button>Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AttendeeFilterDialog
                open={isFilterOpen}
                onOpenChange={setIsFilterOpen}
                filterConfig={filterConfig}
                headers={headers}
                saveFilterConfig={saveFilterConfig}
            />
        </AppLayout>
    );
}
