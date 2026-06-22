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
        year: 'numeric'
    });
};

const SellableRow = ({ item, type, membershipCardName, isLast }: { item: SellableItem; type: 'events' | 'products'; membershipCardName: string; isLast: boolean }) => {
    
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
        <div className={`p-4 flex flex-col lg:flex-row gap-6 relative ${isLast ? '' : 'border-b border-zinc-800'}`}>
            {/* Actions Top Right */}
            <div className="absolute top-4 right-4 flex gap-4">
                <Link href={`/sellables/${type}/${item.id}/edit`} className="text-xs font-bold text-zinc-100 hover:text-white">Edit</Link>
                <Link href={`/sellables/${type}/${item.id}`} method="delete" as="button" type="button" className="text-xs font-bold text-zinc-100 hover:text-white">Remove</Link>
            </div>

            {/* Image */}
            <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-[#18181b]">
                {item.image_path ? (
                     <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                     <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600 uppercase font-medium bg-[#18181b]">No Image</div>
                )}
            </div>
            
            {/* Info */}
            <div className="flex-1 flex flex-col pr-8 lg:pr-12 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-100 leading-tight">{item.name}</h3>
                    {!item.is_online_sellable && (
                        <span className="text-[10px] font-medium bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">Office Shift Only</span>
                    )}
                </div>
                
                <p className="text-[13px] text-zinc-400 mt-1 leading-snug">
                    {item.description}
                </p>

                {item.event_date && (
                    <p className="text-[13px] text-zinc-400 mt-2">
                        Event Date: <span className="text-zinc-100 font-medium">{formatDate(item.event_date)}</span>
                    </p>
                )}

                {sellPeriodText && (
                    <p className="text-[13px] text-zinc-400 mt-1">
                        Sell Period: <span className="text-zinc-100 font-medium">{sellPeriodText}</span>
                    </p>
                )}
                
                <p className="text-[13px] text-zinc-400 mt-1">
                    Price with {membershipCardName}: <span className="text-zinc-100 font-medium">€{Number(item.price_with_membership || 0).toFixed(2)}</span> <span className="mx-0.5">|</span> without {membershipCardName}: <span className="text-zinc-100 font-medium">€{Number(item.price_without_membership || item.price || 0).toFixed(2)}</span>
                </p>
                
                <p className="text-[13px] text-zinc-400 mt-1">
                    {item.is_variant_based ? (
                        <>Quantity by: <span className="text-zinc-100 font-medium">{Object.keys(item.variants_config?.[0] || { id: 0 }).filter(k => k !== 'id' && k !== 'quantity').map(k => k.replace(/_/g, ' ')).join(', ')}</span></>
                    ) : (
                        item.remaining_stock_with_membership !== null || item.remaining_stock_without_membership !== null ? (
                            <>Qty w/ {membershipCardName}: <span className="text-zinc-100 font-medium">{formatStock(item.remaining_stock_with_membership, item.sold_count_with_membership)}</span> | w/o {membershipCardName}: <span className="text-zinc-100 font-medium">{formatStock(item.remaining_stock_without_membership, item.sold_count_without_membership)}</span></>
                        ) : (
                            <>Quantity: <span className="text-zinc-100 font-medium">{formatStock(item.remaining_stock, item.sold_count)}</span></>
                        )
                    )}
                </p>

                {item.responsible_users && (
                    <p className="text-[13px] text-zinc-400 mt-1">
                        Responsible: <span className="text-zinc-100 font-medium">{item.responsible_users}</span>
                    </p>
                )}
            </div>
            
            {/* Variants Matrix */}
            {item.is_variant_based && item.variants_config && item.variants_config.length > 0 && (() => {
                const attrKeys = Object.keys(item.variants_config[0]).filter(k => k !== 'id' && k !== 'quantity');
                const attributes = attrKeys.map(key => {
                    const options = Array.from(new Set(item.variants_config!.map(r => String(r[key] ?? ''))));

                    return { name: key, options };
                });

                const horizontalAttr = attributes.length > 0 
                    ? attributes.reduce((prev, current) => (prev.options.length > current.options.length) ? prev : current) 
                    : null;
                
                if (!horizontalAttr) {
return null;
}

                const verticalAttrs = attributes.filter(a => a.name !== horizontalAttr.name);
                
                let verticalCombos: Record<string, string>[] = [];

                if (verticalAttrs.length > 0) {
                    const result: Record<string, string>[][] = [[]];

                    for (const attr of verticalAttrs) {
                        const newResult: Record<string, string>[][] = [];

                        for (const existing of result) {
                            for (const opt of attr.options) {
                                newResult.push([...existing, { [attr.name]: opt }]);
                            }
                        }

                        result.length = 0;
                        result.push(...newResult);
                    }

                    verticalCombos = result.map(combos => Object.assign({}, ...combos));
                } else {
                    verticalCombos = [{}];
                }

                return (
                    <div className={`shrink-0 w-full lg:w-auto lg:max-w-[66.666667%] pt-6 lg:pt-8 min-w-0 ${type === 'events' ? 'mb-10' : ''}`}>
                        <div className="border border-zinc-800 rounded-md overflow-hidden overflow-x-auto bg-[#09090b]">
                            <table className="w-full text-[11px] text-left">
                                <thead className="bg-[#09090b]">
                                    <tr className="text-zinc-100">
                                        {verticalAttrs.map(a => (
                                            <th key={a.name} className="py-2 px-3 font-medium capitalize border-b border-zinc-800 whitespace-nowrap border-r">{a.name.replace(/_/g, ' ')}</th>
                                        ))}
                                        {horizontalAttr.options.map((opt: string) => (
                                            <th key={opt} className="py-2 px-3 font-medium capitalize border-b border-zinc-800 text-center whitespace-nowrap min-w-[80px]">{opt}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-[#09090b]">
                                    {verticalCombos.map((vCombo, i) => (
                                        <tr key={i} className="text-zinc-300">
                                            {verticalAttrs.map(a => (
                                                <td key={a.name} className={`py-2 px-3 border-r border-zinc-800 ${i !== verticalCombos.length - 1 ? 'border-b' : ''} whitespace-nowrap`}>
                                                    {vCombo[a.name]}
                                                </td>
                                            ))}
                                            {horizontalAttr.options.map((opt: string) => {
                                                const match = item.variants_config!.find((r: any) => {
                                                    if (String(r[horizontalAttr.name] ?? '') !== opt) {
return false;
}

                                                    for (const va of verticalAttrs) {
                                                        if (String(r[va.name] ?? '') !== vCombo[va.name]) {
return false;
}
                                                    }

                                                    return true;
                                                });

                                                return (
                                                    <td key={opt} className={`py-2 px-3 text-center ${i !== verticalCombos.length - 1 ? 'border-b border-zinc-800' : ''}`}>
                                                        {match ? (match.quantity != null ? match.quantity : 'Unl.') : '-'}
                                                    </td>
                                                );
                                            })}
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
                <div className="absolute bottom-4 right-4">
                    <Link href={`/sellables/events/${item.id}/attendees`}>
                        <Button variant="secondary" size="sm" className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700 h-7 text-xs px-3 gap-1.5 font-medium border border-zinc-700">
                            Manage Attendees
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default function Sellables({ events, products, membershipCardName }: any) {
    return (
        <>
            <Head title="Sellables" />
            
            <div className="flex h-full flex-1 flex-col overflow-y-auto">
                <div className="w-full mx-auto p-6 space-y-12">
                    
                    {/* Products Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Products</h2>
                            <Link href="/sellables/products/create">
                                <Button variant="secondary" size="sm" className="bg-white text-black hover:bg-zinc-200 font-medium h-8 px-4 text-xs">
                                    Add Product
                                </Button>
                            </Link>
                        </div>
                        
                        {products && products.length > 0 ? (
                            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#09090b]">
                                {products.map((product: SellableItem, index: number) => (
                                    <SellableRow 
                                        key={product.id} 
                                        item={product} 
                                        type="products" 
                                        membershipCardName={membershipCardName}
                                        isLast={index === products.length - 1}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500">
                                No products have been added yet.
                            </div>
                        )}
                    </section>
                    
                    {/* Events Section */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Events</h2>
                            <Link href="/sellables/events/create">
                                <Button variant="secondary" size="sm" className="bg-white text-black hover:bg-zinc-200 font-medium h-8 px-4 text-xs">
                                    Add Event
                                </Button>
                            </Link>
                        </div>
                        
                        {events && events.length > 0 ? (
                            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#09090b]">
                                {events.map((event: SellableItem, index: number) => (
                                    <SellableRow 
                                        key={event.id} 
                                        item={event} 
                                        type="events" 
                                        membershipCardName={membershipCardName}
                                        isLast={index === events.length - 1}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500">
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
