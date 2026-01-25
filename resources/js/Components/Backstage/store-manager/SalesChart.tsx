import { PlaceholderPattern } from '@/Components/Shared/ui/placeholder-pattern';
import { OnlineSale, Sellable } from '@/types/sellables';
import { useRef, useState } from 'react';

interface SalesChartProps {
    loading: boolean;
    sales: Array<{ date: string; office_total: number; online_total: number }>;
    onlineSales: OnlineSale[];
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
        id: number;
        type: 'product' | 'event';
        name: string;
        count: number;
    }>;
    seriesMax: number;
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
    onlineSellableTotals,
    onlineSellableSeries,
    seriesMax,
}: SalesChartProps) {
    const [hover, setHover] = useState<HoverData | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Sort by count (quantity) descending
    const sortedTotals = [...onlineSellableTotals].sort(
        (a, b) => b.count - a.count,
    );

    // Chart dimensions - remove left/right padding for perfect alignment
    const leftPad = 0;
    const bottomPad = 24;
    const topPad = 8;
    const rightPad = 0;
    const viewBoxWidth = 360;
    const viewBoxHeight = 140;
    const chartW = viewBoxWidth - leftPad - rightPad;
    const chartH = viewBoxHeight - topPad - bottomPad;
    const dateKeys = sales.map((s) => s.date);

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

        // Calculate points for this date
        const points = onlineSellableSeries
            .map((s) => {
                const val = s.series[clampedIndex] || 0;
                const x =
                    leftPad +
                    (clampedIndex / Math.max(1, dateKeys.length - 1)) * chartW;
                const y = topPad + chartH - (val / seriesMax) * chartH;
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
    const yStep = seriesMax / (yTicks - 1);
    const yTickValues = Array.from({ length: yTicks }, (_, i) => yStep * i);

    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Sales</h3>
                <div className="text-sm font-medium">
                    €
                    {onlineSellableTotals
                        .reduce((acc, s) => acc + (s.total || 0), 0)
                        .toFixed(2)}
                </div>
            </div>
            {loading ? (
                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
            ) : (
                <>
                    <div className="relative w-full flex-1">
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
                                            (value / seriesMax) * chartH;
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
                                                    €{value.toFixed(0)}
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
                                                fontSize="7"
                                                fill="currentColor"
                                                opacity={0.6}
                                            >
                                                {formattedDate}
                                            </text>
                                        );
                                    })}

                                    {/* Data series lines */}
                                    {onlineSellableSeries.map((s, idx) => {
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
                                                    (val / seriesMax) * chartH;
                                                return { x, y };
                                            },
                                        );

                                        const d = points
                                            .map(
                                                (p, i) =>
                                                    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`,
                                            )
                                            .join(' ');

                                        return (
                                            <path
                                                key={`series-${idx}`}
                                                d={d}
                                                fill="none"
                                                stroke={s.color}
                                                strokeWidth={2}
                                                strokeOpacity={0.95}
                                                style={{
                                                    pointerEvents: 'none',
                                                }}
                                            />
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
                                                r={4}
                                                fill={point.color}
                                                stroke="white"
                                                strokeWidth={2}
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
                    <div className="mt-3 text-xs">
                        <div className="mb-1 text-muted-foreground">
                            Active online sellables
                        </div>
                        <div className="space-y-1">
                            {sortedTotals.length > 0 ? (
                                sortedTotals.map((s) => {
                                    const total = s.total || 0;
                                    const overall =
                                        sortedTotals.reduce(
                                            (a, it) => a + (it.total || 0),
                                            0,
                                        ) || 0;
                                    const pct =
                                        overall === 0
                                            ? 0
                                            : (total / overall) * 100;
                                    const seriesMeta =
                                        onlineSellableSeries.find(
                                            (ss) =>
                                                ss.id === s.id &&
                                                (ss.type as any) === s.type,
                                        );
                                    const color =
                                        seriesMeta?.color ?? '#6B7280';
                                    const count = s.count ?? 0;

                                    return (
                                        <div
                                            key={`online-sellable-${s.type}-${s.id}`}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <span
                                                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                                <div className="flex min-w-0 flex-1 items-baseline gap-2">
                                                    <span className="truncate" title={s.name}>
                                                        {s.name}
                                                    </span>
                                                    <span className="shrink-0 text-xs text-muted-foreground">
                                                        x {count}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-baseline gap-3">
                                                <div className="font-medium">
                                                    €{total.toFixed(2)}
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
                                    No active online sellables
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
