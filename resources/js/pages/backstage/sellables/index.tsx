import { Head, Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as sellablesRoute } from '@/routes/backstage/sellables';

interface SellableItem {
    id: string;
    name: string;
    description: string | null;
    price?: number;
    price_with_membership: number;
    price_without_membership: number;
    is_online_sellable: boolean;
    remaining_stock: number | null;
    sold_count: number;
    is_split_pool: boolean;
    remaining_stock_with_membership: number | null;
    sold_count_with_membership: number;
    remaining_stock_without_membership: number | null;
    sold_count_without_membership: number;
    is_variant_based: boolean;
    variants_config: any[] | null;
    event_date?: string;
    start_sell_date?: string | null;
    end_sell_date?: string | null;
    image_path?: string | null;
    responsible_users?: string | null;
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const SellableRow = ({
    item,
    type,
    membershipCardName,
    isLast,
}: {
    item: SellableItem;
    type: 'events' | 'products';
    membershipCardName: string;
    isLast: boolean;
}) => {
    let sellPeriodText = '';

    if (item.start_sell_date && item.end_sell_date) {
        sellPeriodText = `${formatDate(item.start_sell_date)} - ${formatDate(item.end_sell_date)}`;

        if (new Date() > new Date(item.end_sell_date)) {
            sellPeriodText += ' | Sale ended';
        }
    } else if (item.start_sell_date) {
        sellPeriodText = `Starts ${formatDate(item.start_sell_date)}`;
    }

    const formatStock = (remaining: number | null, sold: number) => {
        if (remaining === null) {
            return `Unl. / ${sold} sold`;
        }

        return `${remaining} left / ${sold} sold`;
    };

    return (
        <div
            className={`relative flex flex-col gap-6 p-4 lg:flex-row ${isLast ? '' : 'border-b border-zinc-800'}`}
        >
            {/* Actions Top Right */}
            <div className="absolute top-4 right-4 flex gap-4">
                <Link
                    href={`/sellables/${type}/${item.id}/edit`}
                    className="text-xs font-bold text-zinc-100 hover:text-white"
                >
                    Edit
                </Link>
                <Link
                    href={`/sellables/${type}/${item.id}`}
                    method="delete"
                    as="button"
                    type="button"
                    className="text-xs font-bold text-zinc-100 hover:text-white"
                >
                    Remove
                </Link>
            </div>

            {/* Image */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-[#18181b]">
                {item.image_path ? (
                    <img
                        src={item.image_path}
                        alt={item.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#18181b] text-[10px] font-medium text-zinc-600 uppercase">
                        No Image
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col pr-8 lg:pr-12">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm leading-tight font-bold text-zinc-100">
                        {item.name}
                    </h3>
                    {!item.is_online_sellable && (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                            Office Shift Only
                        </span>
                    )}
                </div>

                <p className="mt-1 text-[13px] leading-snug text-zinc-400">
                    {item.description}
                </p>

                {item.event_date && (
                    <p className="mt-2 text-[13px] text-zinc-400">
                        Event Date:{' '}
                        <span className="font-medium text-zinc-100">
                            {formatDate(item.event_date)}
                        </span>
                    </p>
                )}

                {sellPeriodText && (
                    <p className="mt-1 text-[13px] text-zinc-400">
                        Sell Period:{' '}
                        <span className="font-medium text-zinc-100">
                            {sellPeriodText}
                        </span>
                    </p>
                )}

                <p className="mt-1 text-[13px] text-zinc-400">
                    Price with {membershipCardName}:{' '}
                    <span className="font-medium text-zinc-100">
                        €{Number(item.price_with_membership || 0).toFixed(2)}
                    </span>{' '}
                    <span className="mx-0.5">|</span> without{' '}
                    {membershipCardName}:{' '}
                    <span className="font-medium text-zinc-100">
                        €
                        {Number(
                            item.price_without_membership || item.price || 0,
                        ).toFixed(2)}
                    </span>
                </p>

                <p className="mt-1 text-[13px] text-zinc-400">
                    {item.is_variant_based ? (
                        <>
                            Quantity by:{' '}
                            <span className="font-medium text-zinc-100">
                                {Object.keys(
                                    item.variants_config?.[0] || { id: 0 },
                                )
                                    .filter(
                                        (k) => k !== 'id' && k !== 'quantity',
                                    )
                                    .map((k) => k.replace(/_/g, ' '))
                                    .join(', ')}
                            </span>
                        </>
                    ) : item.is_split_pool ? (
                        <>
                            Qty w/ {membershipCardName}:{' '}
                            <span className="font-medium text-zinc-100">
                                {formatStock(
                                    item.remaining_stock_with_membership,
                                    item.sold_count_with_membership,
                                )}
                            </span>{' '}
                            | w/o {membershipCardName}:{' '}
                            <span className="font-medium text-zinc-100">
                                {formatStock(
                                    item.remaining_stock_without_membership,
                                    item.sold_count_without_membership,
                                )}
                            </span>
                        </>
                    ) : (
                        <>
                            Quantity:{' '}
                            <span className="font-medium text-zinc-100">
                                {formatStock(
                                    item.remaining_stock,
                                    item.sold_count,
                                )}
                            </span>
                        </>
                    )}
                </p>

                {item.responsible_users && (
                    <p className="mt-1 text-[13px] text-zinc-400">
                        Responsible:{' '}
                        <span className="font-medium text-zinc-100">
                            {item.responsible_users}
                        </span>
                    </p>
                )}
            </div>

            {/* Variants Matrix */}
            {item.is_variant_based &&
                item.variants_config &&
                item.variants_config.length > 0 &&
                (() => {
                    const attrKeys = Object.keys(
                        item.variants_config[0],
                    ).filter((k) => k !== 'id' && k !== 'quantity');
                    const attributes = attrKeys.map((key) => {
                        const options = Array.from(
                            new Set(
                                item.variants_config!.map((r) =>
                                    String(r[key] ?? ''),
                                ),
                            ),
                        );

                        return { name: key, options };
                    });

                    const horizontalAttr =
                        attributes.length > 0
                            ? attributes.reduce((prev, current) =>
                                  prev.options.length > current.options.length
                                      ? prev
                                      : current,
                              )
                            : null;

                    if (!horizontalAttr) {
                        return null;
                    }

                    const verticalAttrs = attributes.filter(
                        (a) => a.name !== horizontalAttr.name,
                    );

                    let verticalCombos: Record<string, string>[] = [];

                    if (verticalAttrs.length > 0) {
                        const result: Record<string, string>[][] = [[]];

                        for (const attr of verticalAttrs) {
                            const newResult: Record<string, string>[][] = [];

                            for (const existing of result) {
                                for (const opt of attr.options) {
                                    newResult.push([
                                        ...existing,
                                        { [attr.name]: opt },
                                    ]);
                                }
                            }

                            result.length = 0;
                            result.push(...newResult);
                        }

                        verticalCombos = result.map((combos) =>
                            Object.assign({}, ...combos),
                        );
                    } else {
                        verticalCombos = [{}];
                    }

                    return (
                        <div
                            className={`w-full min-w-0 shrink-0 pt-6 lg:w-auto lg:max-w-[66.666667%] lg:pt-8 ${type === 'events' ? 'mb-10' : ''}`}
                        >
                            <div className="overflow-hidden overflow-x-auto rounded-md border border-zinc-800 bg-[#09090b]">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-[#09090b]">
                                        <tr className="text-zinc-100">
                                            {verticalAttrs.map((a) => (
                                                <th
                                                    key={a.name}
                                                    className="border-r border-b border-zinc-800 px-3 py-2 font-medium whitespace-nowrap capitalize"
                                                >
                                                    {a.name.replace(/_/g, ' ')}
                                                </th>
                                            ))}
                                            {horizontalAttr.options.map(
                                                (opt: string) => (
                                                    <th
                                                        key={opt}
                                                        className="min-w-[80px] border-b border-zinc-800 px-3 py-2 text-center font-medium whitespace-nowrap capitalize"
                                                    >
                                                        {opt}
                                                    </th>
                                                ),
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[#09090b]">
                                        {verticalCombos.map((vCombo, i) => (
                                            <tr
                                                key={i}
                                                className="text-zinc-300"
                                            >
                                                {verticalAttrs.map((a) => (
                                                    <td
                                                        key={a.name}
                                                        className={`border-r border-zinc-800 px-3 py-2 ${i !== verticalCombos.length - 1 ? 'border-b' : ''} whitespace-nowrap`}
                                                    >
                                                        {vCombo[a.name]}
                                                    </td>
                                                ))}
                                                {horizontalAttr.options.map(
                                                    (opt: string) => {
                                                        const match =
                                                            item.variants_config!.find(
                                                                (r: any) => {
                                                                    if (
                                                                        String(
                                                                            r[
                                                                                horizontalAttr
                                                                                    .name
                                                                            ] ??
                                                                                '',
                                                                        ) !==
                                                                        opt
                                                                    ) {
                                                                        return false;
                                                                    }

                                                                    for (const va of verticalAttrs) {
                                                                        if (
                                                                            String(
                                                                                r[
                                                                                    va
                                                                                        .name
                                                                                ] ??
                                                                                    '',
                                                                            ) !==
                                                                            vCombo[
                                                                                va
                                                                                    .name
                                                                            ]
                                                                        ) {
                                                                            return false;
                                                                        }
                                                                    }

                                                                    return true;
                                                                },
                                                            );

                                                        return (
                                                            <td
                                                                key={opt}
                                                                className={`px-3 py-2 text-center ${i !== verticalCombos.length - 1 ? 'border-b border-zinc-800' : ''}`}
                                                            >
                                                                {match
                                                                    ? match.quantity !=
                                                                      null
                                                                        ? match.quantity
                                                                        : 'Unl.'
                                                                    : '-'}
                                                            </td>
                                                        );
                                                    },
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })()}

            {/* Manage Attendees Button */}
            {type === 'events' && (
                <div className="absolute right-4 bottom-4">
                    <Link href={`/sellables/events/${item.id}/attendees`}>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 gap-1.5 border border-zinc-700 bg-zinc-800 px-3 text-xs font-medium text-zinc-100 hover:bg-zinc-700"
                        >
                            Manage Attendees
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default function Sellables({
    events,
    products,
    membershipCardName,
}: any) {
    return (
        <>
            <Head title="Sellables" />

            <div className="flex h-full flex-1 flex-col overflow-y-auto">
                <div className="mx-auto w-full space-y-12 p-6">
                    {/* Products Section */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                Products
                            </h2>
                            <Link href="/sellables/products/create">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 bg-white px-4 text-xs font-medium text-black hover:bg-zinc-200"
                                >
                                    Add Product
                                </Button>
                            </Link>
                        </div>

                        {products && products.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#09090b]">
                                {products.map(
                                    (product: SellableItem, index: number) => (
                                        <SellableRow
                                            key={product.id}
                                            item={product}
                                            type="products"
                                            membershipCardName={
                                                membershipCardName
                                            }
                                            isLast={
                                                index === products.length - 1
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                                No products have been added yet.
                            </div>
                        )}
                    </section>

                    {/* Events Section */}
                    <section>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight text-white">
                                Events
                            </h2>
                            <Link href="/sellables/events/create">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="h-8 bg-white px-4 text-xs font-medium text-black hover:bg-zinc-200"
                                >
                                    Add Event
                                </Button>
                            </Link>
                        </div>

                        {events && events.length > 0 ? (
                            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#09090b]">
                                {events.map(
                                    (event: SellableItem, index: number) => (
                                        <SellableRow
                                            key={event.id}
                                            item={event}
                                            type="events"
                                            membershipCardName={
                                                membershipCardName
                                            }
                                            isLast={index === events.length - 1}
                                        />
                                    ),
                                )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                                No events have been added yet.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

Sellables.layout = {
    breadcrumbs: [
        {
            title: 'Sellables',
            href: sellablesRoute().url,
        },
    ],
};
