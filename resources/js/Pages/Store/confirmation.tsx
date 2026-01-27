import ShopLayout from '@/layouts/Store/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { Check, CheckCircle, Copy, FileText } from 'lucide-react';
import { useState } from 'react';

interface SaleItem {
    id: number;
    reference_id: string;
    name: string;
    type: 'product' | 'event';
    amount: number;
    ticket_type: string | null;
}

interface Transaction {
    id: number;
    total_amount: number;
    processing_fee: number;
    discount_codes: string[] | null;
    completed_at: string;
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

    const handlePrint = () => {
        window.print();
    };

    const subtotal =
        Number(transaction.total_amount) - Number(transaction.processing_fee);

    return (
        <ShopLayout>
            <Head title="Order Confirmation" />
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { 
                        margin: 1cm;
                        size: auto;
                    }
                    body { 
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    
                    /* Compact spacing for print */
                    .print-compact-card {
                        padding: 0.75rem !important;
                        margin-bottom: 0.5rem !important;
                    }
                    .print-text-sm {
                        font-size: 0.875rem !important;
                    }
                    .print-text-xs {
                        font-size: 0.75rem !important;
                    }
                    
                    /* Remove backgrounds */
                    .bg-gray-50, .bg-yellow-50 { 
                        background: white !important;
                    }
                    .border-yellow-200 {
                        border-color: #d4d4d4 !important;
                    }
                    .rounded-lg { 
                        border-radius: 0.25rem !important;
                    }
                }
            `}} />
            <div className="min-h-screen bg-white">
                <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 print:px-0 print:py-2">
                    <div className="text-center no-print">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
                            Thank you for your purchase!
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Your order has been confirmed. Please save your
                            reference IDs below.
                        </p>
                    </div>

                    <div className="mt-12 rounded-lg bg-gray-50 p-6 print:mt-2 print:border print:p-3">
                        <div className="mb-6 flex items-baseline justify-between print:mb-3">
                            <h2 className="text-lg font-medium text-gray-900 print:text-base">
                                Order Summary
                            </h2>
                            <div className="flex items-center gap-3">
                                {/* Transaction ID - hidden on web, shown in print */}
                                <span className="hidden print:inline-block text-xs font-mono text-gray-600">
                                    Purchasing Reference #{transaction.id}
                                </span>
                                {/* Download button - shown on web, hidden in print */}
                                <button
                                    onClick={handlePrint}
                                    className="no-print flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                    title="Download summary as PDF"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    Download
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 print:space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-gray-200 bg-white p-4 print-compact-card"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 print-text-sm">
                                                {item.name}
                                            </h3>
                                            {item.ticket_type ===
                                                'with_card' && (
                                                    <p className="mt-1 text-sm text-gray-500 print-text-xs">
                                                        With ESNcard
                                                    </p>
                                                )}
                                            <p className="mt-2 text-sm font-medium text-gray-900 print:mt-1 print-text-sm">
                                                €
                                                {Number(item.amount).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <p className="mb-1 text-xs text-gray-500 print-text-xs">
                                                Reference ID
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <code className="rounded bg-gray-100 px-3 py-1.5 font-mono text-sm font-bold text-gray-800 print:bg-transparent print:px-0 print:py-0 print-text-xs">
                                                    {item.reference_id}
                                                </code>
                                                <button
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            item.reference_id,
                                                        )
                                                    }
                                                    className="rounded-md p-1.5 transition-colors hover:bg-gray-100 no-print"
                                                    title="Copy reference ID"
                                                >
                                                    {copiedId ===
                                                        item.reference_id ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 space-y-2 border-t border-gray-200 pt-6 print:mt-3 print:pt-3 print:space-y-1">
                            <div className="flex justify-between text-sm text-gray-600 print-text-xs">
                                <span>Subtotal</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 print-text-xs">
                                <span>Processing fee</span>
                                <span>
                                    €
                                    {Number(transaction.processing_fee).toFixed(
                                        2,
                                    )}
                                </span>
                            </div>

                            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900 print:pt-1 print-text-sm">
                                <span>Total</span>
                                <span>
                                    €
                                    {Number(transaction.total_amount).toFixed(
                                        2,
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link
                            href={typeof window !== 'undefined' ? window.location.href : '/'}
                            className="inline-block rounded-md bg-black px-6 py-3 font-medium text-white uppercase transition-colors hover:bg-gray-800 print:text-sm print:px-4 print:py-2"
                        >
                            <span className="no-print">Continue Shopping</span>
                            <span className="hidden print:inline">View Receipt</span>
                        </Link>
                    </div>

                    {/* Important notice - shown both on web and in print */}
                    <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 print:mt-4 print:p-2">
                        <p className="text-sm text-yellow-800 print-text-xs">
                            <strong>Important:</strong> Please save your
                            reference IDs or return to this page later. You may still need to register to the
                            event(s) and/or product(s) and might have to provide
                            them in your form submission!
                        </p>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
