import { Head } from '@inertiajs/react';
import axios from 'axios';
import { RefreshCw, Filter, Database, Trash2, Plus } from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import {
    sheets as sheetsRoute,
    rows as rowsRoute,
    updateConfig as updateConfigRoute,
} from '@/routes/backstage/sellables/events/attendees';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

const extractId = (input: string) => {
    if (!input) {
        return '';
    }

    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);

    return match ? match[1] : input;
};

export default function AttendeesIndex({ event }: any) {
    const [spreadsheetId, setSpreadsheetId] = useState(
        event?.google_spreadsheet_id || '',
    );
    const [sheetName, setSheetName] = useState(event?.google_sheet_name || '');
    const [sheets, setSheets] = useState<string[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [loadingSheets, setLoadingSheets] = useState(false);
    const [loadingRows, setLoadingRows] = useState(false);

    const [filterConfig, setFilterConfig] = useState<any[]>(
        event?.attendee_filter_config || [],
    );
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState<any[]>([]);

    const autoSave = useCallback(
        async (payload: any) => {
            try {
                await axios.patch(
                    updateConfigRoute({ event: event.id }).url,
                    payload,
                );
            } catch (e) {
                console.error('Failed to auto save config', e);
            }
        },
        [event.id],
    );

    const fetchRows = useCallback(
        async (id: string, sName: string) => {
            if (!id || !sName) {
                return;
            }

            const parsedId = extractId(id);
            setLoadingRows(true);

            try {
                const { data } = await axios.get(
                    rowsRoute({ event: event.id }).url,
                    {
                        params: { spreadsheet_id: parsedId, sheet_name: sName },
                    },
                );
                setRows(data.rows || []);
            } catch (e) {
                console.error('Error fetching rows', e);
            } finally {
                setLoadingRows(false);
            }
        },
        [event.id],
    );

    const fetchSheets = useCallback(
        async (idToFetch: string) => {
            if (!idToFetch) {
                return;
            }

            const parsedId = extractId(idToFetch);
            setLoadingSheets(true);

            try {
                const { data } = await axios.get(
                    sheetsRoute({ event: event.id }).url,
                    {
                        params: { spreadsheet_id: parsedId },
                    },
                );
                setSheets(data.sheets || []);

                if (data.sheets && data.sheets.length > 0) {
                    if (!sheetName || !data.sheets.includes(sheetName)) {
                        const firstSheet = data.sheets[0];
                        setSheetName(firstSheet);
                        autoSave({
                            google_spreadsheet_id: parsedId,
                            google_sheet_name: firstSheet,
                        });
                        fetchRows(parsedId, firstSheet);
                    }
                }
            } catch (e) {
                console.error('Error fetching sheets', e);
            } finally {
                setLoadingSheets(false);
            }
        },
        [event.id, sheetName, autoSave, fetchRows],
    );

    const debouncedSpreadsheetId = useDebounce(spreadsheetId, 750);

    // Auto load sheets if spreadsheet ID is configured but no sheets loaded yet
    useEffect(() => {
        if (
            event?.google_spreadsheet_id &&
            sheets.length === 0 &&
            !loadingSheets
        ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchSheets(event.google_spreadsheet_id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch rows when sheet name is initially set from backend
    useEffect(() => {
        if (
            event?.google_spreadsheet_id &&
            event?.google_sheet_name &&
            rows.length === 0
        ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchRows(event.google_spreadsheet_id, event.google_sheet_name);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle spreadsheet ID typing
    useEffect(() => {
        if (
            debouncedSpreadsheetId &&
            debouncedSpreadsheetId !== event?.google_spreadsheet_id
        ) {
            const parsedId = extractId(debouncedSpreadsheetId);
            autoSave({ google_spreadsheet_id: parsedId });
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchSheets(parsedId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSpreadsheetId]);

    const handleSheetChange = (val: string) => {
        setSheetName(val);
        const parsedId = extractId(spreadsheetId);
        autoSave({ google_sheet_name: val });
        fetchRows(parsedId, val);
    };

    const handleManualRefresh = () => {
        fetchSheets(spreadsheetId);

        if (sheetName) {
            fetchRows(extractId(spreadsheetId), sheetName);
        }
    };

    const openFilterModal = () => {
        setTempFilters([...filterConfig]);
        setFilterModalOpen(true);
    };

    const saveFilters = () => {
        setFilterConfig(tempFilters);
        autoSave({ attendee_filter_config: tempFilters });
        setFilterModalOpen(false);
    };

    const columns = useMemo(() => {
        if (rows.length === 0) {
            return [];
        }

        return Object.keys(rows[0]);
    }, [rows]);

    const filteredRows = useMemo(() => {
        if (!filterConfig || filterConfig.length === 0) {
            return rows;
        }

        return rows.filter((row) => {
            return filterConfig.every((filter) => {
                if (!filter.column || !filter.operator || !filter.value) {
                    return true;
                }

                const rowVal = String(row[filter.column] || '').toLowerCase();
                const filterVal = filter.value.toLowerCase();

                switch (filter.operator) {
                    case 'Equals':
                        return rowVal === filterVal;
                    case 'Not Equals':
                        return rowVal !== filterVal;
                    case 'Contains':
                        return rowVal.includes(filterVal);
                    case 'Does Not Contain':
                        return !rowVal.includes(filterVal);
                    default:
                        return true;
                }
            });
        });
    }, [rows, filterConfig]);

    return (
        <>
            <Head title={`Attendees - ${event?.name || 'Event'}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto p-6">
                {/* Configuration Section */}
                <div className="rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] p-6 shadow-sm">
                    <h2 className="mb-1 text-lg font-semibold text-white">
                        Google Sheets Configuration
                    </h2>
                    <p className="mb-6 text-sm text-zinc-400">
                        Paste a spreadsheet ID or full Google Sheets URL to
                        import attendees.
                    </p>

                    <div className="grid grid-cols-1 items-end gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">
                                Spreadsheet URL or ID
                            </label>
                            <div className="flex items-center gap-2">
                                <Input
                                    className="flex-1 border-[#2a2a2a] bg-black/50 text-zinc-100"
                                    placeholder="https://docs.google.com/spreadsheets/d/... or ID"
                                    value={spreadsheetId}
                                    onChange={(e) =>
                                        setSpreadsheetId(e.target.value)
                                    }
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 border-[#2a2a2a] bg-black/50 text-zinc-400 hover:text-white"
                                    onClick={handleManualRefresh}
                                    disabled={loadingSheets}
                                >
                                    <RefreshCw
                                        className={`h-4 w-4 ${loadingSheets ? 'animate-spin' : ''}`}
                                    />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">
                                Sheet
                            </label>
                            {sheets.length > 0 ? (
                                <Select
                                    value={sheetName}
                                    onValueChange={handleSheetChange}
                                >
                                    <SelectTrigger className="w-full border-[#2a2a2a] bg-black/50 text-zinc-100">
                                        <SelectValue placeholder="Select a sheet" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#2a2a2a] bg-[#0f0f0f] text-zinc-100">
                                        {sheets.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="flex h-10 items-center rounded-md border border-dashed border-[#2a2a2a] bg-black/30 px-3 py-2 text-sm text-zinc-500">
                                    Enter a spreadsheet and click ↻ to load
                                    sheets.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendees Data Section */}
                <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] shadow-sm">
                    <div className="flex items-center justify-between border-b border-[#1f1f1f] p-4">
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Attendees ({filteredRows.length})
                            </h2>
                            <p className="text-sm text-zinc-400">
                                Live data from Google Sheets.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        <Database className="mr-2 h-4 w-4" />
                                        Full Data Source
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="flex max-h-[85vh] max-w-6xl flex-col overflow-hidden border-[#2a2a2a] bg-[#0f0f0f] text-zinc-100">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Full Data Source
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4 flex-1 overflow-auto rounded-md border border-[#2a2a2a]">
                                        <table className="w-full text-left text-xs whitespace-nowrap text-zinc-400">
                                            <thead className="bg-[#0f0f0f]">
                                                <tr className="border-b border-[#2a2a2a] text-zinc-300">
                                                    {columns.map((c) => (
                                                        <th
                                                            key={c}
                                                            className="px-4 py-3 font-medium"
                                                        >
                                                            {c}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows
                                                    .slice(0, 100)
                                                    .map((row, i) => (
                                                        <tr
                                                            key={i}
                                                            className="border-b border-[#2a2a2a] transition-colors hover:bg-[#141414]"
                                                        >
                                                            {columns.map(
                                                                (c) => (
                                                                    <td
                                                                        key={`${i}-${c}`}
                                                                        className="px-4 py-3 text-zinc-300"
                                                                    >
                                                                        {row[c]}
                                                                    </td>
                                                                ),
                                                            )}
                                                        </tr>
                                                    ))}
                                                {rows.length === 0 && (
                                                    <tr className="border-b border-[#2a2a2a]">
                                                        <td
                                                            colSpan={
                                                                columns.length ||
                                                                1
                                                            }
                                                            className="h-24 text-center text-zinc-500"
                                                        >
                                                            No data available.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="mt-2 text-xs text-zinc-500">
                                        Showing up to 100 rows from the raw data
                                        source.
                                    </p>
                                </DialogContent>
                            </Dialog>

                            <div className="mx-1 h-6 w-px bg-[#2a2a2a]"></div>

                            <Button
                                variant="outline"
                                size="icon"
                                className="border-[#2a2a2a] bg-black/50 text-zinc-400 hover:text-white"
                                onClick={openFilterModal}
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="min-h-[400px] flex-1 overflow-auto p-0">
                        {loadingRows ? (
                            <div className="flex h-full items-center justify-center text-zinc-500">
                                <RefreshCw className="mb-2 h-6 w-6 animate-spin" />
                            </div>
                        ) : filteredRows.length > 0 ? (
                            <table className="w-full text-left text-sm whitespace-nowrap text-zinc-400">
                                <thead className="bg-[#0f0f0f]">
                                    <tr className="sticky top-0 z-10 border-b border-[#1f1f1f] bg-[#0f0f0f] shadow-sm shadow-black/20">
                                        {columns.map((c) => (
                                            <th
                                                key={c}
                                                className="bg-[#0f0f0f] px-4 py-3 font-medium"
                                            >
                                                {c}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRows.map((row, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-[#1f1f1f] transition-colors hover:bg-[#1a1a1a]"
                                        >
                                            {columns.map((c) => (
                                                <td
                                                    key={`${i}-${c}`}
                                                    className="px-4 py-3 text-zinc-300"
                                                >
                                                    {row[c]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-500">
                                {spreadsheetId && sheetName ? (
                                    <>
                                        <Database className="mb-4 h-10 w-10 text-zinc-700" />
                                        <p>
                                            No data found in the configured
                                            spreadsheet.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Database className="mb-4 h-10 w-10 text-zinc-800" />
                                        <p>
                                            Configure a spreadsheet above to
                                            view attendees.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Configuration Modal */}
            <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogContent className="max-w-3xl border-[#2a2a2a] bg-[#0f0f0f] text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Filter Configuration</DialogTitle>
                        <p className="mt-1 text-sm text-zinc-400">
                            Define rules for identifying valid attendees.
                            Changes are only applied when you click Save.
                        </p>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {tempFilters.map((filter, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3"
                            >
                                <Select
                                    value={filter.column}
                                    onValueChange={(v) => {
                                        const newF = [...tempFilters];
                                        newF[index].column = v;
                                        setTempFilters(newF);
                                    }}
                                >
                                    <SelectTrigger className="w-[200px] border-[#2a2a2a] bg-black/50">
                                        <SelectValue placeholder="Select Column" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#2a2a2a] bg-[#0f0f0f] text-zinc-100">
                                        {columns.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={filter.operator || 'Equals'}
                                    onValueChange={(v) => {
                                        const newF = [...tempFilters];
                                        newF[index].operator = v;
                                        setTempFilters(newF);
                                    }}
                                >
                                    <SelectTrigger className="w-[150px] border-[#2a2a2a] bg-black/50">
                                        <SelectValue placeholder="Operator" />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#2a2a2a] bg-[#0f0f0f] text-zinc-100">
                                        <SelectItem value="Equals">
                                            Equals
                                        </SelectItem>
                                        <SelectItem value="Not Equals">
                                            Not Equals
                                        </SelectItem>
                                        <SelectItem value="Contains">
                                            Contains
                                        </SelectItem>
                                        <SelectItem value="Does Not Contain">
                                            Does Not Contain
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input
                                    className="flex-1 border-[#2a2a2a] bg-black/50 text-zinc-100"
                                    placeholder="Value..."
                                    value={filter.value || ''}
                                    onChange={(e) => {
                                        const newF = [...tempFilters];
                                        newF[index].value = e.target.value;
                                        setTempFilters(newF);
                                    }}
                                />

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:bg-red-950/30 hover:text-red-300"
                                    onClick={() =>
                                        setTempFilters(
                                            tempFilters.filter(
                                                (_, i) => i !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            variant="outline"
                            className="w-full border-dashed border-[#2a2a2a] bg-black/30 text-zinc-400 hover:text-white"
                            onClick={() =>
                                setTempFilters([
                                    ...tempFilters,
                                    {
                                        column: '',
                                        operator: 'Equals',
                                        value: '',
                                    },
                                ])
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Rule
                        </Button>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-[#1f1f1f] pt-4">
                        <Button
                            variant="ghost"
                            className="text-zinc-400 hover:text-white"
                            onClick={() => setFilterModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-white text-black hover:bg-zinc-200"
                            onClick={saveFilters}
                        >
                            Save Configuration
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

AttendeesIndex.layout = (page: any) => {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Sellables', href: '/sellables' },
                { title: page.props.event?.name || 'Event' },
                { title: 'Attendees' },
            ]}
        >
            {page}
        </AppLayout>
    );
};
