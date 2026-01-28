import { PlaceholderPattern } from '@/Components/Shared/ui/placeholder-pattern';
import { OfficeSale, OnlineSale, Sellable } from '@/types/sellables';
import { useMemo, useRef, useState } from 'react';

interface SalesChartProps {
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

interface HoverData {
    dateIndex: number;
    date: string;
    mouseX: number;
    mouseY: number;
    points: Array<{
        name: string;
        value: number;
        color: string;
        x: number;
        y: number;
    }>;
}

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
    const [hover, setHover] = useState<HoverData | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const dateKeys = sales.map((s) => s.date);
    const isHourlyData = dateKeys.length > 0 && dateKeys[0].includes(':');

    // Compute combined series based on toggle state
    // Each sellable's series = (office sales if showOffice) + (online sales if showCard)
    const combinedSeries = useMemo(() => {
        // 1. Identify ALL unique keys from known sellables AND actual sales
        const allKeys = new Set<string>();

        // Add known sellables
        onlineSellableSeries.forEach(s => allKeys.add(`${s.type}-${s.id}`));

        // Add keys from sales data
        if (showCard) {
            onlineSales.forEach(os => {
                const type = os.product_id ? 'product' : 'event';
                const id = os.product_id || os.event_id;
                if (id) allKeys.add(`${type}-${id}`);
                else allKeys.add('unknown-null');
            });
            officeSales.filter(os => os.method === 'card').forEach(os => {
                const type = os.product_id ? 'product' : 'event';
                const id = os.product_id || os.event_id;
                if (id) allKeys.add(`${type}-${id}`);
                else allKeys.add('unknown-null');
            });
        }
        if (showOffice) {
            officeSales.filter(os => os.method !== 'card').forEach(os => {
                const type = os.product_id ? 'product' : 'event';
                const id = os.product_id || os.event_id;
                if (id) allKeys.add(`${type}-${id}`);
                else allKeys.add('unknown-null');
            });
        }

        return Array.from(allKeys).map((key) => {
            if (key === 'unknown-null') {
                // Calculate series for Unknown/Orphaned items (missing IDs)
                const series = dateKeys.map((dk) => {
                    let total = 0;
                    if (showCard) {
                        total += onlineSales.reduce((acc, os) => {
                            if (os.product_id || os.event_id) return acc;

                            const soldAt = os.sold_at || '';
                            let matchKey: string;
                            if (isHourlyData) {
                                const dateObj = new Date(soldAt);
                                const year = dateObj.getFullYear();
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(dateObj.getDate()).padStart(2, '0');
                                const hour = String(dateObj.getHours()).padStart(2, '0');
                                matchKey = `${year}-${month}-${day} ${hour}:00:00`;
                            } else {
                                matchKey = soldAt.split('T')[0].split(' ')[0];
                            }
                            if (matchKey !== dk) return acc;
                            return acc + (parseFloat(String(os.amount || 0)) || 0);
                        }, 0);

                        total += officeSales.reduce((acc, os) => {
                            if (os.method !== 'card') return acc;
                            if (os.product_id || os.event_id) return acc;

                            const soldAt = os.sold_at || '';
                            let matchKey: string;
                            if (isHourlyData) {
                                const dateObj = new Date(soldAt);
                                const year = dateObj.getFullYear();
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(dateObj.getDate()).padStart(2, '0');
                                const hour = String(dateObj.getHours()).padStart(2, '0');
                                matchKey = `${year}-${month}-${day} ${hour}:00:00`;
                            } else {
                                matchKey = soldAt.split('T')[0].split(' ')[0];
                            }
                            if (matchKey !== dk) return acc;
                            return acc + (parseFloat(String(os.amount || 0)) || 0);
                        }, 0);
                    }
                    if (showOffice) {
                        total += officeSales.reduce((acc, os) => {
                            if (os.method === 'card') return acc;
                            if (os.product_id || os.event_id) return acc;

                            const soldAt = os.sold_at || '';
                            let matchKey: string;
                            if (isHourlyData) {
                                const dateObj = new Date(soldAt);
                                const year = dateObj.getFullYear();
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const day = String(dateObj.getDate()).padStart(2, '0');
                                const hour = String(dateObj.getHours()).padStart(2, '0');
                                matchKey = `${year}-${month}-${day} ${hour}:00:00`;
                            } else {
                                matchKey = soldAt.split('T')[0].split(' ')[0];
                            }
                            if (matchKey !== dk) return acc;
                            return acc + (parseFloat(String(os.amount || 0)) || 0);
                        }, 0);
                    }
                    return total;
                });
                return {
                    id: 'unknown',
                    type: 'product' as const,
                    name: 'Unknown Item',
                    color: '#9ca3af',
                    series
                };
            }

            const [type, id] = key.split('-');

            // Try to find metadata in known series
            const known = onlineSellableSeries.find(s => s.type === type && String(s.id) === String(id));

            // If unknown, try to find name from ANY sale record
            let name = known?.name;
            if (!name) {
                const saleFn = (os: OnlineSale | OfficeSale) => {
                    const osType = os.product_id ? 'product' : 'event';
                    const osId = os.product_id || os.event_id;
                    return String(osType) === String(type) && String(osId) === String(id);
                };
                const match = onlineSales.find(saleFn) || officeSales.find(saleFn);
                name = match?.product?.name || match?.event?.name || `Unknown ${type === 'product' ? 'Product' : 'Item'} ${id}`;
            }

            const color = known?.color || '#9ca3af'; // Default gray for unknown

            const series = dateKeys.map((dk) => {
                let total = 0;

                // Add online sales for this date if Card toggle is on
                if (showCard) {
                    total += onlineSales.reduce((acc, os) => {
                        const osType = os.product_id ? 'product' : 'event';
                        const osId = os.product_id || os.event_id;
                        if (!osId) return acc; // Skip null IDs (handled in unknown-null)

                        if (String(osType) !== String(type) || String(osId) !== String(id)) return acc;

                        const soldAt = os.sold_at || '';
                        let matchKey: string;
                        if (isHourlyData) {
                            const dateObj = new Date(soldAt);
                            const year = dateObj.getFullYear();
                            const month = String(
                                dateObj.getMonth() + 1,
                            ).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(
                                2,
                                '0',
                            );
                            const hour = String(
                                dateObj.getHours(),
                            ).padStart(2, '0');
                            matchKey = `${year}-${month}-${day} ${hour}:00:00`;
                        } else {
                            matchKey = soldAt.split('T')[0].split(' ')[0];
                        }
                        if (matchKey !== dk) return acc;
                        return acc + (parseFloat(String(os.amount || 0)) || 0);
                    }, 0);

                    // Also add Office sales made via CARD
                    total += officeSales.reduce((acc, os) => {
                        if (os.method !== 'card') return acc;
                        const osType = os.product_id ? 'product' : 'event';
                        const osId = os.product_id || os.event_id;
                        if (!osId) return acc; // Skip null IDs

                        if (String(osType) !== String(type) || String(osId) !== String(id)) return acc;

                        const soldAt = os.sold_at || '';
                        let matchKey: string;
                        if (isHourlyData) {
                            const dateObj = new Date(soldAt);
                            const year = dateObj.getFullYear();
                            const month = String(
                                dateObj.getMonth() + 1,
                            ).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(
                                2,
                                '0',
                            );
                            const hour = String(
                                dateObj.getHours(),
                            ).padStart(2, '0');
                            matchKey = `${year}-${month}-${day} ${hour}:00:00`;
                        } else {
                            matchKey = soldAt.split('T')[0].split(' ')[0];
                        }
                        if (matchKey !== dk) return acc;
                        return acc + (parseFloat(String(os.amount || 0)) || 0);
                    }, 0);
                }

                // Add office sales for this date if Office toggle is on (CASH ONLY)
                if (showOffice) {
                    total += officeSales.reduce((acc, os) => {
                        if (os.method === 'card') return acc;
                        const osType = os.product_id ? 'product' : 'event';
                        const osId = os.product_id || os.event_id;
                        if (!osId) return acc; // Skip null IDs

                        if (String(osType) !== String(type) || String(osId) !== String(id)) return acc;

                        const soldAt = os.sold_at || '';
                        let matchKey: string;
                        if (isHourlyData) {
                            const dateObj = new Date(soldAt);
                            const year = dateObj.getFullYear();
                            const month = String(
                                dateObj.getMonth() + 1,
                            ).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(
                                2,
                                '0',
                            );
                            const hour = String(
                                dateObj.getHours(),
                            ).padStart(2, '0');
                            matchKey = `${year}-${month}-${day} ${hour}:00:00`;
                        } else {
                            matchKey = soldAt.split('T')[0].split(' ')[0];
                        }
                        if (matchKey !== dk) return acc;
                        return acc + (parseFloat(String(os.amount || 0)) || 0);
                    }, 0);
                }

                return total;
            });
            return { id, type, name, color, series };
        })
            .filter((s) => {
                // Filter out ANY series that has 0 total across the entire period
                const overallTotal = s.series.reduce((a, b) => a + b, 0);
                return overallTotal > 0;
            });
    }, [
        onlineSellableSeries,
        dateKeys,
        isHourlyData,
        onlineSales,
        officeSales,
        showOffice,
        showCard,
    ]);

    // Color palette for chart lines
    const colorPalette = [
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#06B6D4', // Cyan
        '#F97316', // Orange
        '#6366F1', // Indigo
        '#84CC16', // Lime
        '#14B8A6', // Teal
        '#D946EF', // Fuchsia
        '#64748B', // Slate
    ];

    const getColor = (index: number, id: string) => {
        if (id === 'unknown') return '#9ca3af'; // Gray for unknown
        // Use palette first, then hash if we run out
        if (index < colorPalette.length) return colorPalette[index];

        // Simple hash for consistent colors beyond palette
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00ffffff).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    // Calculate dynamic max based on combined series
    const visibleMax = Math.max(1, ...combinedSeries.flatMap((s) => s.series));

    // Compute dynamic sellable totals based on toggle state
    // This includes ALL items that have sales (not just online sellables)
    const filteredTotals = useMemo(() => {
        const totalsMap = new Map<
            string,
            {
                id: string;
                type: 'product' | 'event';
                name: string;
                total: number;
                count: number;
                color: string;
            }
        >();

        // Helper to track color assignment index
        let colorIndex = 0;
        const colorMap = new Map<string, string>();

        // Pre-assign colors to known series first for consistency
        onlineSellableSeries.forEach(s => {
            const key = `${s.type}-${s.id}`;
            // If the backend provided a color, use it? Or override for uniqueness?
            // Let's stick to our palette for guaranteed uniqueness if backend colors are colliding
            // checking if backend provided something specific (usually they don't, just random)
            colorMap.set(key, getColor(colorIndex++, String(s.id)));
        });

        const processSale = (
            os: OnlineSale | OfficeSale,
            isOffice: boolean,
        ) => {
            const amount = parseFloat(String(os.amount || 0)) || 0;
            const type = os.product_id ? 'product' : 'event';
            const id = os.product_id || os.event_id || 'unknown'; // Handle null ID

            // correct method check
            if (isOffice) {
                const method = (os as OfficeSale).method;
                if (method === 'card' && !showCard) return;
                if (method !== 'card' && !showOffice) return;
            } else {
                if (!showCard) return;
            }

            const key = id === 'unknown' ? 'unknown' : `${type}-${id}`;
            const existing = totalsMap.get(key);

            if (existing) {
                existing.total += amount;
                existing.count += 1;
            } else {
                // If it's a known item, grab metadata
                const seriesMeta = onlineSellableSeries.find(
                    (s) => s.type === type && String(s.id) === String(id),
                );

                let name = seriesMeta?.name;
                if (!name) {
                    if (id === 'unknown') name = 'Unknown Item';
                    else name = os.product?.name || os.event?.name || `${type === 'product' ? 'Product' : 'Event'} ${id}`;
                }

                // Determine Color
                if (!colorMap.has(key)) {
                    if (id === 'unknown') colorMap.set(key, '#9ca3af');
                    else colorMap.set(key, getColor(colorIndex++, String(id)));
                }

                totalsMap.set(key, {
                    id: String(id),
                    type,
                    name,
                    total: amount,
                    count: 1,
                    color: colorMap.get(key)!,
                });
            }
        };

        // Process online sales (always Card)
        onlineSales.forEach((os) => processSale(os, false));

        // Process office sales (mix of Card/Cash)
        officeSales.forEach((os) => processSale(os, true));

        return Array.from(totalsMap.values()).sort((a, b) => b.total - a.total); // Sort by total revenue
    }, [onlineSales, officeSales, onlineSellableSeries, showOffice, showCard]);

    // Update combinedSeries colors to match totalsMap
    // We need to re-map combinedSeries to ensure they use the SAME colors as the legend
    const coloredCombinedSeries = useMemo(() => {
        return combinedSeries.map(s => {
            // Find matching logic
            const key = s.id === 'unknown' ? 'unknown' : `${s.type}-${s.id}`;
            const totalEntry = filteredTotals.find(t => {
                if (t.id === 'unknown' && s.id === 'unknown') return true;
                return t.type === s.type && t.id === s.id;
            });

            return {
                ...s,
                color: totalEntry?.color || s.color // Fallback to existing if not in totals (shouldn't happen if sales > 0)
            };
        });
    }, [combinedSeries, filteredTotals]);


    // Chart dimensions - remove left/right padding for perfect alignment
    const leftPad = 0;
    const bottomPad = 20;
    const topPad = 4;
    const rightPad = 0;
    const viewBoxWidth = 360;
    const viewBoxHeight = 100;
    const chartW = viewBoxWidth - leftPad - rightPad;
    const chartH = viewBoxHeight - topPad - bottomPad;

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current || !sales || sales.length === 0) return;

        const rect = svgRef.current.getBoundingClientRect();
        const scaleX = viewBoxWidth / rect.width;
        const svgX = (e.clientX - rect.left) * scaleX;

        // Find closest date index based on mouse X position
        const chartX = svgX - leftPad;
        const ratio = chartX / chartW;
        const dateIndex = Math.round(ratio * (dateKeys.length - 1));
        const clampedIndex = Math.max(
            0,
            Math.min(dateKeys.length - 1, dateIndex),
        );

        // Calculate points for this date using COLORED combinedSeries
        const points = coloredCombinedSeries
            .map((s) => {
                const val = s.series[clampedIndex] || 0;
                const x =
                    leftPad +
                    (clampedIndex / Math.max(1, dateKeys.length - 1)) * chartW;
                const y = topPad + chartH - (val / visibleMax) * chartH;
                return { name: s.name, value: val, color: s.color, x, y };
            })
            .filter((p) => p.value > 0);

        setHover({
            dateIndex: clampedIndex,
            date: dateKeys[clampedIndex],
            mouseX: e.clientX - rect.left,
            mouseY: e.clientY - rect.top,
            points,
        });
    };

    // Calculate Y-axis ticks (5 ticks including 0)
    const yTicks = 5;
    const yStep = visibleMax / (yTicks - 1);
    const yTickValues = Array.from({ length: yTicks }, (_, i) => yStep * i);

    // Calculate dynamic total based on visible categories
    const displayedTotal =
        (showOffice ? totalOffice : 0) + (showCard ? totalOnline : 0);

    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="shrink-0 text-sm font-semibold">Sales</h3>
                <div className="custom-scrollbar flex items-center gap-3 overflow-x-auto overflow-y-hidden pb-1 text-xs sm:pb-0">
                    <button
                        onClick={() => setShowOffice(!showOffice)}
                        className={`flex items-center gap-1.5 whitespace-nowrap transition-opacity ${showOffice ? 'opacity-100' : 'opacity-40'}`}
                        title="Toggle Office Revenue"
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
                        title="Toggle Card/Online Revenue"
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
                    <div className="relative min-h-0 w-full flex-1">
                        <svg
                            ref={svgRef}
                            viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHover(null)}
                        >
                            {sales && sales.length > 0 && (
                                <>
                                    {/* Y-axis grid lines and labels */}
                                    {yTickValues.map((value, i) => {
                                        const y =
                                            topPad +
                                            chartH -
                                            (value / visibleMax) * chartH;
                                        return (
                                            <g key={`y-tick-${i}`}>
                                                <line
                                                    x1={leftPad}
                                                    y1={y}
                                                    x2={leftPad + chartW}
                                                    y2={y}
                                                    stroke="currentColor"
                                                    strokeOpacity={0.1}
                                                    strokeWidth={1}
                                                />
                                                <text
                                                    x={leftPad - 3}
                                                    y={y}
                                                    textAnchor="end"
                                                    dominantBaseline="middle"
                                                    fontSize="8"
                                                    fill="currentColor"
                                                    opacity={0.6}
                                                >
                                                    €
                                                    {value >= 1000
                                                        ? `${(value / 1000).toFixed(1)}k`
                                                        : value.toFixed(0)}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* X-axis labels - intelligently spaced to prevent overflow */}
                                    {dateKeys.map((date, i) => {
                                        // Detect if this is hourly data (has hour component)
                                        const isHourly = date.includes(':');

                                        // Show fewer labels for more data points
                                        const step =
                                            dateKeys.length > 20
                                                ? 4
                                                : dateKeys.length > 10
                                                    ? 2
                                                    : 1;

                                        // Always show first and last, then every nth
                                        const shouldShow =
                                            i === 0 ||
                                            i === dateKeys.length - 1 ||
                                            i % step === 0;

                                        if (!shouldShow) return null;

                                        const x =
                                            leftPad +
                                            (i /
                                                Math.max(
                                                    1,
                                                    dateKeys.length - 1,
                                                )) *
                                            chartW;
                                        const y = topPad + chartH + 12;

                                        let formattedDate;
                                        if (isHourly) {
                                            // Format as time (e.g., "14:00")
                                            const dateObj = new Date(date);
                                            formattedDate =
                                                dateObj.toLocaleTimeString(
                                                    'en-US',
                                                    {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: false,
                                                    },
                                                );
                                        } else {
                                            // Format as date (e.g., "Jan 25")
                                            formattedDate = new Date(
                                                date,
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            });
                                        }

                                        return (
                                            <text
                                                key={`x-label-${i}`}
                                                x={x}
                                                y={y}
                                                textAnchor={
                                                    i === 0
                                                        ? 'start'
                                                        : i ===
                                                            dateKeys.length - 1
                                                            ? 'end'
                                                            : 'middle'
                                                }
                                                fontSize="5"
                                                fontWeight="300"
                                                fill="currentColor"
                                                opacity={0.5}
                                            >
                                                {formattedDate}
                                            </text>
                                        );
                                    })}

                                    {/* Combined sellable lines (office + online based on toggles) */}
                                    {coloredCombinedSeries.map((s, idx) => {
                                        const points = s.series.map(
                                            (val: number, i: number) => {
                                                const x =
                                                    leftPad +
                                                    (i /
                                                        Math.max(
                                                            1,
                                                            dateKeys.length - 1,
                                                        )) *
                                                    chartW;
                                                const y =
                                                    topPad +
                                                    chartH -
                                                    (val / visibleMax) * chartH;
                                                return { x, y };
                                            },
                                        );

                                        const d = points
                                            .map(
                                                (p, i) =>
                                                    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                                            )
                                            .join(' ');

                                        const isSinglePoint = points.length === 1;

                                        return (
                                            <g key={`series-${idx}`}>
                                                <path
                                                    d={d}
                                                    fill="none"
                                                    stroke={s.color}
                                                    strokeWidth={1.5}
                                                    strokeOpacity={0.95}
                                                    style={{
                                                        pointerEvents: 'none',
                                                    }}
                                                />
                                                {isSinglePoint && (
                                                    <circle
                                                        cx={points[0].x}
                                                        cy={points[0].y}
                                                        r={3}
                                                        fill={s.color}
                                                        stroke="none"
                                                    />
                                                )}
                                            </g>
                                        );
                                    })}

                                    {/* Vertical hover line */}
                                    {hover && (
                                        <line
                                            x1={
                                                leftPad +
                                                (hover.dateIndex /
                                                    Math.max(
                                                        1,
                                                        dateKeys.length - 1,
                                                    )) *
                                                chartW
                                            }
                                            y1={topPad}
                                            x2={
                                                leftPad +
                                                (hover.dateIndex /
                                                    Math.max(
                                                        1,
                                                        dateKeys.length - 1,
                                                    )) *
                                                chartW
                                            }
                                            y2={topPad + chartH}
                                            stroke="currentColor"
                                            strokeOpacity={0.3}
                                            strokeWidth={1}
                                            strokeDasharray="3,3"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}

                                    {/* Circle indicators on hover */}
                                    {hover &&
                                        hover.points.map((point, i) => (
                                            <circle
                                                key={`hover-point-${i}`}
                                                cx={point.x}
                                                cy={point.y}
                                                r={3}
                                                fill={point.color}
                                                stroke="white"
                                                strokeWidth={1}
                                                style={{
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        ))}
                                </>
                            )}
                        </svg>

                        {/* Tooltip */}
                        {hover && hover.points.length > 0 && (
                            <div
                                className="pointer-events-none absolute z-10 max-w-[200px] rounded-lg border border-sidebar-border bg-background p-2 shadow-lg sm:max-w-xs"
                                style={{
                                    left:
                                        hover.mouseX > 180
                                            ? `${hover.mouseX - 220}px`
                                            : `${hover.mouseX + 10}px`,
                                    top:
                                        hover.mouseY > 80
                                            ? `${hover.mouseY - 80}px`
                                            : `${hover.mouseY + 10}px`,
                                }}
                            >
                                <div className="mb-1 text-[10px] font-medium sm:text-xs">
                                    {new Date(hover.date).toLocaleDateString(
                                        'en-US',
                                        {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        },
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {hover.points.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1 text-[10px] sm:gap-2 sm:text-xs"
                                        >
                                            <span
                                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                            <span className="min-w-0 truncate">
                                                {item.name}
                                            </span>
                                            <span className="ml-auto shrink-0 font-medium">
                                                €{item.value.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-2 shrink-0 text-xs">
                        <div className="mb-1 text-muted-foreground">
                            Active sellables
                        </div>
                        <div className="space-y-1 pr-2">
                            {filteredTotals.length > 0 ? (
                                filteredTotals.map((s) => {
                                    const overall =
                                        filteredTotals.reduce(
                                            (a, it) => a + it.total,
                                            0,
                                        ) || 0;
                                    const pct =
                                        overall === 0
                                            ? 0
                                            : (s.total / overall) * 100;

                                    return (
                                        <div
                                            key={`sellable-${s.type}-${s.id}`}
                                            className="flex items-center justify-between gap-3 text-[10px] sm:text-xs"
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
