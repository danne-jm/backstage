import * as React from 'react';

/**
 * Recipient summary component
 * Shows domain analysis and potential typos
 */
interface RecipientSummaryProps {
    data: Record<string, any>[];
    emailField: string;
}

export function RecipientSummary({ data, emailField }: RecipientSummaryProps) {
    const analysis = React.useMemo(() => {
        const emails = data
            .map((row) => String(row[emailField] ?? '').trim())
            .filter(Boolean);

        const domains = emails.map((email) =>
            email.includes('@') ? email.split('@')[1].toLowerCase() : ''
        );

        const domainCounts: Record<string, number> = {};
        domains.forEach((domain) => {
            if (domain) {
                domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            }
        });

        const knownDomains = [
            'gmail.com',
            'hotmail.com',
            'yahoo.com',
            'outlook.com',
            'live.com',
            'icloud.com',
            'student.kuleuven.be',
            'kuleuven.be',
            'hotmail.co.uk',
            'yahoo.co.uk',
            'protonmail.com',
            'proton.me',
            'telenet.be',
            'skynet.be',
            'example.com',
        ];

        const domainEntries = Object.entries(domainCounts).sort(
            (a, b) => b[1] - a[1]
        );
        
        const suspicious = domainEntries.filter(
            ([domain]) => !knownDomains.includes(domain)
        );

        return { emails, domainEntries, suspicious, knownDomains };
    }, [data, emailField]);

    return (
        <div className="flex h-full max-h-[75vh] flex-col overflow-y-auto rounded-md border bg-background p-4">
            <div className="flex-shrink-0">
                <h4 className="text-sm font-semibold">Recipients summary</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                    Domain analysis and potential typos
                </p>
            </div>

            <div className="mt-3 space-y-3 text-xs">
                <div>
                    <div className="text-xs font-medium">Known domains</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {analysis.knownDomains.join(', ')}
                    </div>
                </div>

                <div>
                    <div className="text-xs font-medium">Domain counts</div>
                    <ul className="mt-1 list-disc pl-5">
                        {analysis.domainEntries.length === 0 ? (
                            <li className="text-muted-foreground">
                                No recipient emails found
                            </li>
                        ) : (
                            analysis.domainEntries.map(([domain, count]) => (
                                <li
                                    key={domain}
                                    className={
                                        'flex items-center justify-between ' +
                                        (analysis.knownDomains.includes(domain)
                                            ? ''
                                            : 'text-red-600 dark:text-red-400')
                                    }
                                >
                                    <span className="mr-2">{domain}</span>
                                    <span className="text-muted-foreground">
                                        {count}
                                    </span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {analysis.suspicious.length > 0 && (
                    <div>
                        <div className="text-xs font-medium text-red-600 dark:text-red-400">
                            Potential typos
                        </div>
                        <div className="mt-1 text-xs">
                            {analysis.suspicious.map(([domain]) => (
                                <div key={domain} className="mb-2">
                                    <div className="font-medium">{domain}</div>
                                    <div className="text-muted-foreground">
                                        Addresses:
                                    </div>
                                    <ul className="mt-1 list-disc pl-5 text-xs">
                                        {analysis.emails
                                            .filter((email) =>
                                                email.endsWith(`@${domain}`)
                                            )
                                            .slice(0, 5)
                                            .map((email) => (
                                                <li key={email}>{email}</li>
                                            ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
