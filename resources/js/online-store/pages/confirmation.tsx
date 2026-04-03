import { Head, Link } from '@inertiajs/react';
import { Check, CheckCircle, Copy, FileText } from 'lucide-react';
import { useState } from 'react';
import ShopLayout from '@store/layouts/shop-layout';

interface SaleItem {
    id: string;
    reference_id: string;
    name: string;
    type: 'product' | 'event';
    amount: number;
    ticket_type: string | null;
    variant_options?: Record<string, string> | null;
    code_used?: string | null;
}

interface Transaction {
    id: string;
    total_amount: number;
    processing_fee: number;
    discount_codes: string[] | null;
    completed_at: string;
    payment_status: string;
}

interface Props {
    transaction: Transaction;
    items: SaleItem[];
}

export default function Confirmation({ transaction, items }: Props) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = (referenceId: string) => {
        navigator.clipboard.writeText(referenceId);
        setCopiedId(referenceId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const subtotal = Number(transaction.total_amount) - Number(transaction.processing_fee);

    return (
        <ShopLayout>
            <Head title="Order Confirmation" />
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    .print-compact-card { padding: 0.75rem !important; margin-bottom: 0.5rem !important; }
                    .print-text-sm { font-size: 0.875rem !important; }
                    .print-text-xs { font-size: 0.75rem !important; }
                    .bg-gray-50, .bg-yellow-50 { background: white !important; }
                    .border-yellow-200 { border-color: #d4d4d4 !important; }
                    .rounded-lg { border-radius: 0.25rem !important; }
                }
            `,
                }}
            />
            <div className="min-h-screen bg-white">
                <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8 print:px-0 print:py-2">
                    <div className="no-print text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500 sm:h-16 sm:w-16" />
                        <h1 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:mt-4 sm:text-3xl">
                            Thank you for your purchase!
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 sm:text-base">
                            Your order has been confirmed. Please save your reference IDs below.
                        </p>
                    </div>

                    <div className="mt-8 rounded-lg bg-gray-50 p-4 sm:mt-12 sm:p-6 print:mt-2 print:border print:p-3">
                        <div className="mb-4 flex items-baseline justify-between sm:mb-6 print:mb-3">
                            <h2 className="text-base font-medium text-gray-900 sm:text-lg print:text-base">
                                Order Summary
                            </h2>
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="hidden font-mono text-xs text-gray-600 print:inline-block">
                                    Purchasing Reference #{transaction.id}
                                </span>
                                <button
                                    onClick={() => window.print()}
                                    className="no-print flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:gap-1.5 sm:px-3 sm:py-1.5"
                                    title="Download summary as PDF"
                                >
                                    <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span className="hidden sm:inline">Download</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 sm:space-y-4 print:space-y-2">
                            {items.map((item) => {
                                const hasVariants =
                                    item.variant_options && Object.keys(item.variant_options).length > 0;
                                const hasEsnCardDiscount = Boolean(item.code_used || item.ticket_type === 'with_card');

                                return (
                                    <div
                                        key={item.id}
                                        className="print-compact-card rounded-lg border border-gray-200 bg-white p-3 sm:p-4"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="print-text-sm text-sm font-medium text-gray-900 sm:text-base">
                                                    {item.name}
                                                </h3>
                                                {hasVariants && (
                                                    <p className="print-text-xs mt-1 text-xs text-gray-500 sm:text-sm">
                                                        {Object.entries(item.variant_options!)
                                                            .map(([key, value]) => `${key}: ${value}`)
                                                            .join(', ')}
                                                    </p>
                                                )}
                                                {hasEsnCardDiscount && (
                                                    <p className="print-text-xs mt-1 text-xs text-gray-500 sm:text-sm">
                                                        With ESNcard
                                                    </p>
                                                )}
                                                <p className="print-text-sm mt-1.5 text-sm font-medium text-gray-900 sm:mt-2 sm:text-base print:mt-1">
                                                    €{Number(item.amount).toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="ml-2 flex-shrink-0 text-right sm:ml-4">
                                                <p className="print-text-xs mb-1 text-xs text-gray-500">
                                                    Reference ID
                                                </p>
                                                <div className="flex items-center gap-1 sm:gap-2">
                                                    <code className="print-text-xs rounded bg-gray-100 px-2 py-1 font-mono text-xs font-bold text-gray-800 sm:px-3 sm:py-1.5 sm:text-sm print:bg-transparent print:px-0 print:py-0">
                                                        {item.reference_id}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(item.reference_id)}
                                                        className="no-print rounded-md p-1 transition-colors hover:bg-gray-100 sm:p-1.5"
                                                        title="Copy reference ID"
                                                    >
                                                        {copiedId === item.reference_id ? (
                                                            <Check className="h-3.5 w-3.5 text-green-500 sm:h-4 sm:w-4" />
                                                        ) : (
                                                            <Copy className="h-3.5 w-3.5 text-gray-400 sm:h-4 sm:w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 space-y-1.5 border-t border-gray-200 pt-4 sm:mt-6 sm:space-y-2 sm:pt-6 print:mt-3 print:space-y-1 print:pt-3">
                            <div className="print-text-xs flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="print-text-xs flex justify-between text-sm text-gray-600">
                                <span>Processing fee</span>
                                <span>€{Number(transaction.processing_fee).toFixed(2)}</span>
                            </div>
                            <div className="print-text-sm flex justify-between border-t border-gray-200 pt-1.5 text-base font-bold text-gray-900 sm:pt-2 sm:text-lg print:pt-1">
                                <span>Total</span>
                                <span>€{Number(transaction.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-center sm:mt-8">
                        <Link
                            href="/"
                            className="no-print inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white uppercase transition-colors hover:bg-gray-800 sm:px-6 sm:py-3 sm:text-base"
                        >
                            Continue Shopping
                        </Link>
                        <a
                            href={typeof window !== 'undefined' ? window.location.href : '#'}
                            className="hidden rounded-md bg-black px-4 py-2 text-sm font-medium text-white uppercase print:inline-block"
                        >
                            View Order
                        </a>
                    </div>

                    <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3 sm:mt-8 sm:p-4 print:mt-4 print:p-2">
                        <p className="print-text-xs text-xs text-yellow-800 sm:text-sm">
                            <strong>Important:</strong> Please save your reference IDs or return to this page later.
                            You may still need to register to the event(s) and/or product(s) and might have to provide
                            them in your form submission!
                        </p>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
