
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, ChevronRight, XCircle, CheckCircle, Mail as MailIcon } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Mails',
        href: '/mails',
    },
];

export default function Mails() {
    const { props } = usePage<SharedData & { 
        mails: any; 
        events: any[]; 
        senders: any[];
        filters: any;
    }>();
    
    const { mails, events, senders, filters } = props;

    const [expandedRow, setExpandedRow] = React.useState<number | null>(null);
    const [ticketData, setTicketData] = React.useState<any>(null);
    const [loadingTicket, setLoadingTicket] = React.useState(false);

    const [eventFilter, setEventFilter] = React.useState(filters.event_id || '');
    const [senderFilter, setSenderFilter] = React.useState(filters.user_id || '');
    const [startDateFilter, setStartDateFilter] = React.useState(filters.start_date || '');
    const [endDateFilter, setEndDateFilter] = React.useState(filters.end_date || '');

    const handleFilterChange = () => {
        const query: any = {};
        if (eventFilter && eventFilter !== 'all') query.event_id = eventFilter;
        if (senderFilter && senderFilter !== 'all') query.user_id = senderFilter;
        if (startDateFilter) query.start_date = startDateFilter;
        if (endDateFilter) query.end_date = endDateFilter;

        router.get('/mails', query, { preserveState: true, replace: true });
    };
    
    const resetFilters = () => {
        setEventFilter('');
        setSenderFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        router.get('/mails', {}, { preserveState: true, replace: true });
    }

    const toggleRow = (mailId: number) => {
        if (expandedRow === mailId) {
            setExpandedRow(null);
            setTicketData(null);
        } else {
            setExpandedRow(mailId);
            setLoadingTicket(true);
            axios.get(`/mails/${mailId}/ticket`)
                .then(res => {
                    setTicketData(res.data);
                })
                .catch(() => {
                    setTicketData({ error: 'Could not load ticket data.' });
                })
                .finally(() => {
                    setLoadingTicket(false);
                });
        }
    };

    const isQrMail = (mail: any) => {
        return mail.metadata && mail.metadata.__ticket_id;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mail Logs" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <h2 className="text-lg font-semibold mb-4">
                        Filter Mails <span className="text-muted-foreground text-sm">({mails.total} total)</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select value={String(eventFilter)} onValueChange={setEventFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by event..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                {events.map(event => (
                                    <SelectItem key={event.id} value={String(event.id)}>{event.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={String(senderFilter)} onValueChange={setSenderFilter}>
                            <SelectTrigger><SelectValue placeholder="Filter by sender..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Senders</SelectItem>
                                {senders.map(sender => (
                                    <SelectItem key={sender.id} value={String(sender.id)}>{sender.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={startDateFilter}
                            onChange={e => setStartDateFilter(e.target.value)}
                            placeholder="Start date"
                        />
                        <Input
                            type="date"
                            value={endDateFilter}
                            onChange={e => setEndDateFilter(e.target.value)}
                            placeholder="End date"
                        />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleFilterChange}>Apply Filters</Button>
                        <Button variant="ghost" onClick={resetFilters}>Reset</Button>
                    </div>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Body</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Sender</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mails.data.map((mail: any) => (
                                <React.Fragment key={mail.id}>
                                    <TableRow>
                                        <TableCell>
                                            {isQrMail(mail) ? (
                                                <Button variant="ghost" size="sm" onClick={() => toggleRow(mail.id)}>
                                                    {expandedRow === mail.id ? <ChevronDown /> : <ChevronRight />}
                                                </Button>
                                            ) : (
                                                <div className="w-6"></div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {mail.success ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" title={mail.error_message}/>}
                                        </TableCell>
                                        <TableCell>{mail.recipient_email}</TableCell>
                                        <TableCell>{mail.subject}</TableCell>
                                        <TableCell>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="truncate max-w-[150px] block">
                                                            {mail.body ? mail.body.substring(0, 50) + (mail.body.length > 50 ? '...' : '') : 'N/A'}
                                                        </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-md p-2 bg-gray-800 text-white rounded shadow-lg">
                                                        <p>{mail.body}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </TableCell>
                                        <TableCell>{mail.event?.name || 'N/A'}</TableCell>
                                        <TableCell>{mail.user ? mail.user.email : 'N/A'}</TableCell>
                                        <TableCell>{format(new Date(mail.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                                    </TableRow>
                                    {expandedRow === mail.id && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="p-0">
                                                <div className="bg-muted/50 p-4">
                                                    {loadingTicket && <p>Loading ticket data...</p>}
                                                    {ticketData?.error && <p className="text-red-500">{ticketData.error}</p>}
                                                    {ticketData && !ticketData.error && (
                                                        <div>
                                                            <h4 className="font-semibold mb-2">Ticket Details</h4>
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div><span className="font-medium text-muted-foreground">Ticket Code:</span> {ticketData.ticket_code}</div>
                                                                <div><span className="font-medium text-muted-foreground">Unique Trait:</span> {ticketData.unique_trait}</div>
                                                                <div><span className="font-medium text-muted-foreground">Scan Count:</span> {ticketData.scan_count}</div>
                                                                <div><span className="font-medium text-muted-foreground">Scanned At:</span> {ticketData.scanned_at ? format(new Date(ticketData.scanned_at), 'yyyy-MM-dd HH:mm') : 'Not scanned'}</div>
                                                                {ticketData.scan_details && <div><span className="font-medium text-muted-foreground">Scan Details:</span> <pre className="text-xs bg-background p-2 rounded-md">{JSON.stringify(ticketData.scan_details, null, 2)}</pre></div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4">
                        <Pagination>
                            <PaginationContent className="gap-3 md:gap-4 lg:gap-6 flex-wrap">
                                {mails.links.map((link: any, index: number) => (
                                     <PaginationItem key={index} className="mx-2 md:mx-3 lg:mx-4">
                                         <PaginationLink href={link.url} isActive={link.active} dangerouslySetInnerHTML={{ __html: link.label }} disabled={!link.url}></PaginationLink>
                                     </PaginationItem>
                                ))}
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
