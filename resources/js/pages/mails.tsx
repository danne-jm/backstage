import { MailFilters } from '@/components/mails/MailFilters';
import { MailTicketDetails } from '@/components/mails/MailTicketDetails';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { CheckCircle, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import * as React from 'react';

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
                <MailFilters
                    events={events}
                    senders={senders}
                    initialFilters={filters}
                    totalMails={mails.total}
                />


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
                                            {mail.success ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <div title={mail.error_message}>
                                                    <XCircle className="h-5 w-5 text-red-500" />
                                                </div>
                                            )}
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
                                                <MailTicketDetails loading={loadingTicket} ticketData={ticketData} />

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
                                        <PaginationLink
                                            size="default"
                                            href={link.url || '#'}
                                            isActive={link.active}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                            className={
                                                !link.url
                                                    ? 'pointer-events-none opacity-50'
                                                    : ''
                                            }
                                        />
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
