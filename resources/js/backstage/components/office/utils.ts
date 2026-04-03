export const denominationConfig = [
    { key: '50e', label: '€50' },
    { key: '20e', label: '€20' },
    { key: '10e', label: '€10' },
    { key: '5e', label: '€5' },
    { key: '2e', label: '€2' },
    { key: '1e', label: '€1' },
    { key: '50c', label: '50¢' },
    { key: '20c', label: '20¢' },
    { key: '10c', label: '10¢' },
    { key: '5c', label: '5¢' },
    { key: '2c', label: '2¢' },
    { key: '1c', label: '1¢' },
    { key: 'token', label: 'Pink Token' },
];

export const computeBreakdownTotal = (
    bd?: Record<string, number> | null,
): number => {
    if (!bd) return 0;
    const map: Record<string, number> = {
        '500e': 500,
        '200e': 200,
        '100e': 100,
        '50e': 50,
        '20e': 20,
        '10e': 10,
        '5e': 5,
        '2e': 2,
        '1e': 1,
        '50c': 0.5,
        '20c': 0.2,
        '10c': 0.1,
        '5c': 0.05,
        '2c': 0.02,
        '1c': 0.01,
        token: 0.0,
    };
    return Object.keys(bd).reduce(
        (sum: number, k: string) => sum + Number(bd[k] || 0) * (map[k] ?? 0),
        0,
    );
};

export const formatTimestamp = (iso?: string | null) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const summarizeSales = (sales?: any[]) => {
    if (!Array.isArray(sales) || sales.length === 0) return '';
    const normalizeName = (sale: any) =>
        String(sale?.name ?? 'Unknown')
            .trim()
            .replace(/\s*\(.*\)$/, '')
            .trim();
    const groups: Record<
        string,
        { name: string; count: number; isEvent: boolean }
    > = {};
    for (const s of sales) {
        const base = normalizeName(s);
        const isEvent = Boolean(
            s?.item_type === 'event' || s?.ticket_type || s?.ticket_label,
        );
        if (!groups[base]) groups[base] = { name: base, count: 0, isEvent };
        groups[base].count += 1;
        if (isEvent) groups[base].isEvent = true;
    }
    const grouped = Object.values(groups);
    grouped.sort((a, b) => {
        const diff = b.count - a.count; // sort by quantity, highest first
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
    });
    return grouped.map((g) => `${g.name} ${g.count}`).join(' | ');
};
