import * as React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { CheckCircle, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { MailFilters } from '@/components/email-distributor/mail-filters';
import { MailTicketDetails } from '@/components/email-distributor/mail-ticket-details';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Email Distributor', href: '/email-distributor' },
    { title: 'All Mails', href: '/email-distributor/mails' },
];

export default function Mails() {
    const props = usePage().props as any;
    const { mails, events, senders, filters } = props;

    const [expandedRow, setExpandedRow] = React.useState<string | null>(null);
    const [ticketData, setTicketData] = React.useState<any>(null);
    const [loadingTicket, setLoadingTicket] = React.useState(false);

    const toggleRow = (mailId: string, isQr: boolean) => {
        if (expandedRow === mailId) {
            setExpandedRow(null);
            setTicketData(null);
        } else {
            setExpandedRow(mailId);
            if (isQr) {
                setLoadingTicket(true);
                axios
                    .get(`/email-distributor/mails/${mailId}/ticket`)
                    .then((res) => setTicketData(res.data))
                    .catch(() => setTicketData({ error: 'Could not load ticket data.' }))
                    .finally(() => setLoadingTicket(false));
            } else {
                setTicketData(null);
            }
        }
    };

    const isQrMail = (mail: any) => mail.metadata && mail.metadata.__ticket_id;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="All Mails" />

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
                                <TableHead className="w-12" />
                                <TableHead>Status</TableHead>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Sender</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mails.data.map((mail: any) => {
                                const isQr = isQrMail(mail);
                                return (
                                    <React.Fragment key={mail.id}>
                                        <TableRow>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleRow(mail.id, isQr)}
                                                >
                                                    {expandedRow === mail.id ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </Button>
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
                                            <TableCell className="max-w-[150px] truncate">{mail.subject}</TableCell>
                                            <TableCell>
                                                {isQr ? (
                                                    <Badge variant="default" className="text-xs">Ticket</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">Text</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{mail.event?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                {mail.user ? mail.user.email : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(mail.created_at), 'yyyy-MM-dd HH:mm')}
                                            </TableCell>
                                        </TableRow>

                                        {expandedRow === mail.id && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="p-0">
                                                    <MailTicketDetails
                                                        loading={loadingTicket}
                                                        ticketData={ticketData}
                                                        mail={mail}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {mails.links && mails.links.length > 3 && (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
                            {mails.links.map((link: any, index: number) => (
                                <Link
                                    key={index}
                                    href={link.url || '#'}
                                    preserveScroll
                                >
                                    <Button
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        className="min-w-[2rem] text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
