import * as React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
    title?: string;
    triggerLabel?: string;
    fields: string[];
    sampleData: Record<string, any>[];
};

export default function FullDataDialog({ title = 'Full Data Source', triggerLabel = 'Manage', fields, sampleData }: Props) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost">{triggerLabel}</Button>
            </DialogTrigger>

            <DialogContent className="flex h-[90vh] !w-[95vw] !max-w-[95vw] flex-col overflow-hidden p-4 sm:!max-w-[95vw]">
                <DialogTitle>{title}</DialogTitle>
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
                                            {fields.map((f) => (
                                                <th key={f} className="sticky top-0 z-10 border-b bg-background/95 pr-2 text-left text-xs backdrop-blur-sm">{f}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sampleData.map((r, idx) => (
                                            <tr key={idx} className="border-t">
                                                {fields.map((h) => (
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
    );
}
