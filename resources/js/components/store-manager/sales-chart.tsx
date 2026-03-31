import { useMemo, useState } from 'react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import type { OfficeSale, OnlineSale, Sellable } from '@/types/sellables';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TooltipPayloadItem {
    dataKey?: string | number;
    name?: string;
    value?: number;
    color?: string;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
    label?: string;
}

export interface SalesChartProps {
    loading: boolean;
    sales: Array<{ date: string; office_total: number; online_total: number }>;
    onlineSales: OnlineSale[];
    officeSales: OfficeSale[];
    onlineSellableTotals: Array<Sellable & { total: number; count: number }>;
    onlineSellableSeries: Array<
        Sellable & {
            total: number;
            count: number;
            series: number[];
            color: string;
        }
    >;
    sellableCounts: Array<{
        id: string;
        type: 'product' | 'event';
        name: string;
        count: number;
    }>;
    totalOffice: number;
    totalOnline: number;
    onlineSellablesCount: number;
    topSellerName: string;
}

// ─── Vibrant colour palette ───────────────────────────────────────────────────

const COLOR_PALETTE = [
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF1493', // Deep Pink
    '#FFD700', // Gold
    '#00FF00', // Lime
    '#FF4500', // Orange Red
    '#8A2BE2', // Blue Violet
    '#FF69B4', // Hot Pink
    '#00CED1', // Dark Turquoise
    '#FF6347', // Tomato
    '#7FFF00', // Chartreuse
    '#FF00AA', // Neon Pink
    '#00FF7F', // Spring Green
    '#FF1492', // Deep Pink 2
    '#1E90FF', // Dodger Blue
    '#FFFF00', // Yellow
    '#FF00DD', // Fuchsia
    '#00FFAA', // Mint
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload || payload.length === 0) return null;

    const items = payload
        .filter((p) => p.value !== undefined && p.value > 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    if (items.length === 0) return null;

    return (
        <div className="pointer-events-none max-w-[200px] rounded-lg border border-sidebar-border bg-background p-2 shadow-lg sm:max-w-xs">
            <div className="mb-1 text-[10px] font-medium sm:text-xs">
                {label}
            </div>
            <div className="space-y-1">
                {items.map((item) => (
                    <div
                        key={item.dataKey}
                        className="flex items-center gap-1 text-[10px] sm:gap-2 sm:text-xs"
                    >
                        <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="min-w-0 truncate">{item.name}</span>
                        <span className="ml-auto shrink-0 font-medium">
                            €{Number(item.value).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SalesChart({
    loading,
    sales,
    onlineSales,
    officeSales,
    onlineSellableSeries,
    totalOffice,
    totalOnline,
}: SalesChartProps) {
    const [showOffice, setShowOffice] = useState(true);
    const [showCard, setShowCard] = useState(true);

    const dateKeys = sales.map((s) => s.date);
    const isHourlyData = dateKeys.length > 0 && dateKeys[0].includes(':');

    // Build a stable colour map so toggling filters doesn't reshuffle colours
    const sellableColorMap = useMemo(() => {
        const allSellablesMap = new Map<
            string,
            { name: string; color: string }
        >();

        const registerSales = (salesList: (OnlineSale | OfficeSale)[]) => {
            salesList.forEach((sale) => {
                const name =
                    sale.product?.name ||
                    sale.event?.name ||
                    (sale.product_id || sale.event_id
                        ? `${sale.product_id ? 'product' : 'event'} ${sale.product_id || sale.event_id}`
                        : 'Unknown Item');
                if (!allSellablesMap.has(name)) {
                    allSellablesMap.set(name, { name, color: '' });
                }
            });
        };

        onlineSellableSeries.forEach((s) => {
            if (!allSellablesMap.has(s.name)) {
                allSellablesMap.set(s.name, { name: s.name, color: '' });
            }
        });
        registerSales(onlineSales);
        registerSales(officeSales);

        const sortedNames = Array.from(allSellablesMap.keys()).sort();
        const colorMap = new Map<string, string>();
        sortedNames.forEach((name, idx) => {
            colorMap.set(name, COLOR_PALETTE[idx % COLOR_PALETTE.length]);
        });

        return colorMap;
    }, [onlineSales, officeSales, onlineSellableSeries]);

    // Build chart data points and active sellable list
    const { chartData, activeSellables } = useMemo(() => {
        const sellablesMap = new Map<
            string,
            { name: string; type: 'product' | 'event' }
        >();

        onlineSellableSeries.forEach((s) => {
            sellablesMap.set(`${s.type}-${s.id}`, {
                name: s.name,
                type: s.type,
            });
        });

        const registerSalesSellables = (
            salesList: (OnlineSale | OfficeSale)[],
        ) => {
            salesList.forEach((sale) => {
                const type = sale.product_id ? 'product' : 'event';
                const id = sale.product_id || sale.event_id;
                if (!id) {
                    sellablesMap.set('unknown', {
                        name: 'Unknown Item',
                        type: 'product',
                    });
                    return;
                }
                const key = `${type}-${id}`;
                if (!sellablesMap.has(key)) {
                    const name =
                        sale.product?.name ||
                        sale.event?.name ||
                        `${type} ${id}`;
                    sellablesMap.set(key, { name, type });
                }
            });
        };

        if (showCard) {
            registerSalesSellables(onlineSales);
            registerSalesSellables(
                officeSales.filter((os) => os.method === 'card'),
            );
        }
        if (showOffice) {
            registerSalesSellables(
                officeSales.filter((os) => os.method !== 'card'),
            );
        }

        const matchDate = (saleDate: string, dk: string) => {
            if (isHourlyData) {
                const d = new Date(saleDate);
                const y = d.getUTCFullYear();
                const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
                const day = String(d.getUTCDate()).padStart(2, '0');
                const h = String(d.getUTCHours()).padStart(2, '0');
                return `${y}-${mo}-${day} ${h}:00:00` === dk;
            }
            return saleDate.split('T')[0].split(' ')[0] === dk;
        };

        const data = dateKeys.map((dk) => {
            let dateLabel: string;
            if (isHourlyData) {
                const d = new Date(dk.replace(' ', 'T') + 'Z');
                const h = String(d.getHours()).padStart(2, '0');
                const m = String(d.getMinutes()).padStart(2, '0');
                dateLabel = `${h}:${m}`;
            } else {
                dateLabel = new Date(dk).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
            }
            const point: Record<string, unknown> = {
                date: dateLabel,
                fullDate: dk,
            };

            sellablesMap.forEach((meta, key) => {
                let total = 0;

                const accumulate = (salesList: (OnlineSale | OfficeSale)[]) => {
                    salesList.forEach((os) => {
                        if (!matchDate(os.sold_at || '', dk)) return;
                        const saleType = os.product_id ? 'product' : 'event';
                        const saleId = os.product_id || os.event_id;
                        const matches =
                            (key === 'unknown' &&
                                !os.product_id &&
                                !os.event_id) ||
                            `${saleType}-${saleId}` === key;
                        if (matches)
                            total += parseFloat(String(os.amount || 0)) || 0;
                    });
                };

                if (showCard) {
                    accumulate(onlineSales);
                    accumulate(
                        officeSales.filter((os) => os.method === 'card'),
                    );
                }
                if (showOffice) {
                    accumulate(
                        officeSales.filter((os) => os.method !== 'card'),
                    );
                }

                point[meta.name] = total;
            });

            return point;
        });

        // Count totals for legend
        const totalsMap = new Map<
            string,
            { name: string; total: number; count: number }
        >();

        const countSale = (sale: OnlineSale | OfficeSale, name: string) => {
            const amount = parseFloat(String(sale.amount || 0)) || 0;
            const existing = totalsMap.get(name);
            if (existing) {
                existing.total += amount;
                existing.count += 1;
            } else {
                totalsMap.set(name, { name, total: amount, count: 1 });
            }
        };

        const nameOf = (sale: OnlineSale | OfficeSale) => {
            const type = sale.product_id ? 'product' : 'event';
            const id = sale.product_id || sale.event_id;
            if (!id) return 'Unknown Item';
            return sale.product?.name || sale.event?.name || `${type} ${id}`;
        };

        if (showCard) {
            onlineSales.forEach((os) => countSale(os, nameOf(os)));
            officeSales
                .filter((os) => os.method === 'card')
                .forEach((os) => countSale(os, nameOf(os)));
        }
        if (showOffice) {
            officeSales
                .filter((os) => os.method !== 'card')
                .forEach((os) => countSale(os, nameOf(os)));
        }

        const sellables = Array.from(totalsMap.values())
            .filter((item) => item.count > 0)
            .sort((a, b) => b.total - a.total)
            .map((item) => ({
                ...item,
                color: sellableColorMap.get(item.name) || COLOR_PALETTE[0],
            }));

        return { chartData: data, activeSellables: sellables };
    }, [
        dateKeys,
        isHourlyData,
        onlineSales,
        officeSales,
        onlineSellableSeries,
        showOffice,
        showCard,
        sellableColorMap,
    ]);

    const displayedTotal =
        (showOffice ? totalOffice : 0) + (showCard ? totalOnline : 0);

    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            {/* Header */}
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="shrink-0 text-sm font-semibold">Sales</h3>
                <div className="custom-scrollbar flex items-center gap-3 overflow-x-auto overflow-y-hidden pb-1 text-xs sm:pb-0">
                    <button
                        onClick={() => setShowOffice(!showOffice)}
                        className={`flex items-center gap-1.5 whitespace-nowrap transition-opacity ${showOffice ? 'opacity-100' : 'opacity-40'}`}
                        title="Toggle Office / Cash Revenue"
                    >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                        <span className="text-muted-foreground">Cash:</span>
                        <span className="font-medium text-foreground">
                            €{totalOffice.toFixed(2)}
                        </span>
                    </button>
                    <button
                        onClick={() => setShowCard(!showCard)}
                        className={`flex items-center gap-1.5 whitespace-nowrap transition-opacity ${showCard ? 'opacity-100' : 'opacity-40'}`}
                        title="Toggle Card / Online Revenue"
                    >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                        <span className="text-muted-foreground">Card:</span>
                        <span className="font-medium text-foreground">
                            €{totalOnline.toFixed(2)}
                        </span>
                    </button>
                    <div className="ml-0 text-sm font-semibold whitespace-nowrap sm:ml-1">
                        €{displayedTotal.toFixed(2)}
                    </div>
                </div>
            </div>

            {loading ? (
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
            ) : (
                <>
                    {/* Chart */}
                    <div className="relative min-h-0 w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 5,
                                    right: 5,
                                    left: -12.5,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="currentColor"
                                    strokeOpacity={0.08}
                                />
                                <XAxis
                                    dataKey="date"
                                    interval={isHourlyData ? 1 : Math.max(0, Math.ceil(chartData.length / 6) - 1)}
                                    tick={{
                                        fontSize: 11,
                                        fill: 'currentColor',
                                        opacity: 0.5,
                                    }}
                                    stroke="currentColor"
                                    strokeOpacity={0.2}
                                />
                                <YAxis
                                    tick={{
                                        fontSize: 11,
                                        fill: 'currentColor',
                                        opacity: 0.5,
                                    }}
                                    stroke="currentColor"
                                    strokeOpacity={0.2}
                                    domain={[0, 'auto']}
                                    tickFormatter={(v) =>
                                        v >= 1000
                                            ? `€${(v / 1000).toFixed(1)}k`
                                            : `€${v}`
                                    }
                                    width={50}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{
                                        stroke: 'currentColor',
                                        strokeOpacity: 0.2,
                                    }}
                                />
                                {activeSellables.map((s) => (
                                    <Line
                                        key={s.name}
                                        type="monotone"
                                        dataKey={s.name}
                                        stroke={s.color}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="mt-2 shrink-0 text-xs">
                        <div className="mb-1 text-muted-foreground">
                            Active sellables
                        </div>
                        <div className="h-[116px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                            {activeSellables.length > 0 ? (
                                activeSellables.map((s) => {
                                    const overall =
                                        activeSellables.reduce(
                                            (a, it) => a + it.total,
                                            0,
                                        ) || 0;
                                    const pct =
                                        overall === 0
                                            ? 0
                                            : (s.total / overall) * 100;

                                    return (
                                        <div
                                            key={s.name}
                                            className="flex h-5 items-center justify-between gap-3 text-[10px] sm:text-xs"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <span
                                                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            s.color,
                                                    }}
                                                />
                                                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                                                    <span
                                                        className="truncate"
                                                        title={s.name}
                                                    >
                                                        {s.name}
                                                    </span>
                                                    <span className="shrink-0 text-muted-foreground">
                                                        x {s.count}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-baseline gap-3">
                                                <div className="font-medium">
                                                    €{s.total.toFixed(2)}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {pct.toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-muted-foreground">
                                    No sales in this period
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
