import { Head, usePage } from '@inertiajs/react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Filter, Database, Trash2, Plus, CheckCircle, Mail } from 'lucide-react';
import axios from 'axios';
import { sheets as sheetsRoute, rows as rowsRoute, updateConfig as updateConfigRoute } from '@/routes/backstage/sellables/events/attendees';

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const extractId = (input: string) => {
    if (!input) return '';
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
};

export default function AttendeesIndex({ event }: any) {
    const [spreadsheetId, setSpreadsheetId] = useState(event?.google_spreadsheet_id || '');
    const [sheetName, setSheetName] = useState(event?.google_sheet_name || '');
    const [sheets, setSheets] = useState<string[]>([]);
    const [rows, setRows] = useState<any[]>([]);
    const [loadingSheets, setLoadingSheets] = useState(false);
    const [loadingRows, setLoadingRows] = useState(false);

    const [filterConfig, setFilterConfig] = useState<any[]>(event?.attendee_filter_config || []);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState<any[]>([]);

    const autoSave = async (payload: any) => {
        try {
            await axios.patch(updateConfigRoute({ event: event.id }).url, payload);
        } catch (e) {
            console.error("Failed to auto save config", e);
        }
    };

    const fetchSheets = useCallback(async (idToFetch: string) => {
        if (!idToFetch) return;
        const parsedId = extractId(idToFetch);
        setLoadingSheets(true);
        try {
            const { data } = await axios.get(sheetsRoute({ event: event.id }).url, {
                params: { spreadsheet_id: parsedId }
            });
            setSheets(data.sheets || []);
            if (data.sheets && data.sheets.length > 0) {
                if (!sheetName || !data.sheets.includes(sheetName)) {
                    const firstSheet = data.sheets[0];
                    setSheetName(firstSheet);
                    autoSave({ google_spreadsheet_id: parsedId, google_sheet_name: firstSheet });
                    fetchRows(parsedId, firstSheet);
                }
            }
        } catch (e) {
            console.error("Error fetching sheets", e);
        } finally {
            setLoadingSheets(false);
        }
    }, [event.id, sheetName]);

    const fetchRows = useCallback(async (id: string, sName: string) => {
        if (!id || !sName) return;
        const parsedId = extractId(id);
        setLoadingRows(true);
        try {
            const { data } = await axios.get(rowsRoute({ event: event.id }).url, {
                params: { spreadsheet_id: parsedId, sheet_name: sName }
            });
            setRows(data.rows || []);
        } catch (e) {
            console.error("Error fetching rows", e);
        } finally {
            setLoadingRows(false);
        }
    }, [event.id]);

    const debouncedSpreadsheetId = useDebounce(spreadsheetId, 750);

    // Auto load sheets if spreadsheet ID is configured but no sheets loaded yet
    useEffect(() => {
        if (event?.google_spreadsheet_id && sheets.length === 0 && !loadingSheets) {
            fetchSheets(event.google_spreadsheet_id);
        }
    }, []);

    // Fetch rows when sheet name is initially set from backend
    useEffect(() => {
        if (event?.google_spreadsheet_id && event?.google_sheet_name && rows.length === 0) {
            fetchRows(event.google_spreadsheet_id, event.google_sheet_name);
        }
    }, []);

    // Handle spreadsheet ID typing
    useEffect(() => {
        if (debouncedSpreadsheetId && debouncedSpreadsheetId !== event?.google_spreadsheet_id) {
            const parsedId = extractId(debouncedSpreadsheetId);
            autoSave({ google_spreadsheet_id: parsedId });
            fetchSheets(parsedId);
        }
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
        if (rows.length === 0) return [];
        return Object.keys(rows[0]);
    }, [rows]);

    const filteredRows = useMemo(() => {
        if (!filterConfig || filterConfig.length === 0) return rows;
        return rows.filter(row => {
            return filterConfig.every(filter => {
                if (!filter.column || !filter.operator || !filter.value) return true;
                const rowVal = String(row[filter.column] || '').toLowerCase();
                const filterVal = filter.value.toLowerCase();
                switch (filter.operator) {
                    case 'Equals': return rowVal === filterVal;
                    case 'Not Equals': return rowVal !== filterVal;
                    case 'Contains': return rowVal.includes(filterVal);
                    case 'Does Not Contain': return !rowVal.includes(filterVal);
                    default: return true;
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
                    <h2 className="text-lg font-semibold text-white mb-1">Google Sheets Configuration</h2>
                    <p className="text-sm text-zinc-400 mb-6">Paste a spreadsheet ID or full Google Sheets URL to import attendees.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Spreadsheet URL or ID</label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    className="bg-black/50 border-[#2a2a2a] text-zinc-100 flex-1"
                                    placeholder="https://docs.google.com/spreadsheets/d/... or ID"
                                    value={spreadsheetId}
                                    onChange={(e) => setSpreadsheetId(e.target.value)}
                                />
                                <Button 
                                    variant="outline" 
                                    size="icon"
                                    className="border-[#2a2a2a] bg-black/50 text-zinc-400 hover:text-white shrink-0"
                                    onClick={handleManualRefresh}
                                    disabled={loadingSheets}
                                >
                                    <RefreshCw className={`h-4 w-4 ${loadingSheets ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Sheet</label>
                            {sheets.length > 0 ? (
                                <Select value={sheetName} onValueChange={handleSheetChange}>
                                    <SelectTrigger className="bg-black/50 border-[#2a2a2a] text-zinc-100 w-full">
                                        <SelectValue placeholder="Select a sheet" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a] text-zinc-100">
                                        {sheets.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="h-10 px-3 py-2 text-sm text-zinc-500 bg-black/30 border border-[#2a2a2a] border-dashed rounded-md flex items-center">
                                    Enter a spreadsheet and click ↻ to load sheets.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Attendees Data Section */}
                <div className="rounded-xl border border-[#1f1f1f] bg-[#0f0f0f] shadow-sm flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-[#1f1f1f] flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Attendees ({filteredRows.length})</h2>
                            <p className="text-sm text-zinc-400">Live data from Google Sheets.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="text-zinc-400 hover:text-white">
                                        <Database className="h-4 w-4 mr-2" />
                                        Full Data Source
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col bg-[#0f0f0f] border-[#2a2a2a] text-zinc-100">
                                    <DialogHeader>
                                        <DialogTitle>Full Data Source</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex-1 overflow-auto border border-[#2a2a2a] rounded-md mt-4">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                                                    {columns.map(c => (
                                                        <TableHead key={c} className="text-zinc-400 font-medium">{c}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rows.slice(0, 100).map((row, i) => (
                                                    <TableRow key={i} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                                                        {columns.map(c => (
                                                            <TableCell key={`${i}-${c}`} className="text-zinc-300 py-2">
                                                                {row[c]}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                                {rows.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={columns.length || 1} className="h-24 text-center text-zinc-500">
                                                            No data available.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">Showing up to 100 rows from the raw data source.</p>
                                </DialogContent>
                            </Dialog>

                            <div className="w-px h-6 bg-[#2a2a2a] mx-1"></div>

                            <Button variant="outline" size="icon" className="border-[#2a2a2a] bg-black/50 text-zinc-400 hover:text-white" onClick={openFilterModal}>
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0 min-h-[400px]">
                        {loadingRows ? (
                            <div className="h-full flex items-center justify-center text-zinc-500">
                                <RefreshCw className="h-6 w-6 animate-spin mb-2" />
                            </div>
                        ) : filteredRows.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-[#1f1f1f] hover:bg-transparent sticky top-0 bg-[#0f0f0f] z-10 shadow-sm shadow-black/20">
                                        {columns.map(c => (
                                            <TableHead key={c} className="text-zinc-400 font-medium bg-[#0f0f0f]">{c}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRows.map((row, i) => (
                                        <TableRow key={i} className="border-[#1f1f1f] hover:bg-[#1a1a1a]">
                                            {columns.map(c => (
                                                <TableCell key={`${i}-${c}`} className="text-zinc-300 py-3">
                                                    {row[c]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center">
                                {spreadsheetId && sheetName ? (
                                    <>
                                        <Database className="h-10 w-10 text-zinc-700 mb-4" />
                                        <p>No data found in the configured spreadsheet.</p>
                                    </>
                                ) : (
                                    <>
                                        <Database className="h-10 w-10 text-zinc-800 mb-4" />
                                        <p>Configure a spreadsheet above to view attendees.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Filter Configuration Modal */}
            <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
                <DialogContent className="bg-[#0f0f0f] border-[#2a2a2a] text-zinc-100 max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Filter Configuration</DialogTitle>
                        <p className="text-sm text-zinc-400 mt-1">Define rules for identifying valid attendees. Changes are only applied when you click Save.</p>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {tempFilters.map((filter, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <Select 
                                    value={filter.column} 
                                    onValueChange={(v) => {
                                        const newF = [...tempFilters];
                                        newF[index].column = v;
                                        setTempFilters(newF);
                                    }}
                                >
                                    <SelectTrigger className="w-[200px] bg-black/50 border-[#2a2a2a]">
                                        <SelectValue placeholder="Select Column" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a] text-zinc-100">
                                        {columns.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
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
                                    <SelectTrigger className="w-[150px] bg-black/50 border-[#2a2a2a]">
                                        <SelectValue placeholder="Operator" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f0f0f] border-[#2a2a2a] text-zinc-100">
                                        <SelectItem value="Equals">Equals</SelectItem>
                                        <SelectItem value="Not Equals">Not Equals</SelectItem>
                                        <SelectItem value="Contains">Contains</SelectItem>
                                        <SelectItem value="Does Not Contain">Does Not Contain</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Input 
                                    className="flex-1 bg-black/50 border-[#2a2a2a] text-zinc-100"
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
                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                                    onClick={() => setTempFilters(tempFilters.filter((_, i) => i !== index))}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <Button 
                            variant="outline" 
                            className="w-full border-[#2a2a2a] border-dashed bg-black/30 text-zinc-400 hover:text-white"
                            onClick={() => setTempFilters([...tempFilters, { column: '', operator: 'Equals', value: '' }])}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Rule
                        </Button>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[#1f1f1f]">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setFilterModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="bg-white text-black hover:bg-zinc-200" onClick={saveFilters}>
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
