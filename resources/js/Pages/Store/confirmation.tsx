import ShopLayout from '@/layouts/Store/shop-layout';
import { Head, Link } from '@inertiajs/react';
import { Check, CheckCircle, Copy } from 'lucide-react';
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

    const subtotal =
        Number(transaction.total_amount) - Number(transaction.processing_fee);

    return (
        <ShopLayout>
            <Head title="Order Confirmation" />
            <div className="min-h-screen bg-white">
                <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
                            Thank you for your purchase!
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Your order has been confirmed. Please save your
                            reference IDs below.
                        </p>
                    </div>

                    <div className="mt-12 rounded-lg bg-gray-50 p-6">
                        <h2 className="mb-6 text-lg font-medium text-gray-900">
                            Order Details
                        </h2>

                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-gray-200 bg-white p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">
                                                {item.name}
                                            </h3>
                                            {item.ticket_type && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {item.ticket_type ===
                                                        'with_card'
                                                        ? 'With ESNcard'
                                                        : 'Without ESNcard'}
                                                </p>
                                            )}
                                            <p className="mt-2 text-sm font-medium text-gray-900">
                                                €
                                                {Number(item.amount).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <p className="mb-1 text-xs text-gray-500">
                                                Reference ID
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <code className="rounded bg-gray-100 px-3 py-1.5 font-mono text-sm font-bold text-gray-800">
                                                    {item.reference_id}
                                                </code>
                                                <button
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            item.reference_id,
                                                        )
                                                    }
                                                    className="rounded-md p-1.5 transition-colors hover:bg-gray-100"
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

                        <div className="mt-6 space-y-2 border-t border-gray-200 pt-6">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Processing fee</span>
                                <span>
                                    €
                                    {Number(transaction.processing_fee).toFixed(
                                        2,
                                    )}
                                </span>
                            </div>
                            {transaction.discount_codes &&
                                transaction.discount_codes.length > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Discount codes</span>
                                        <span>
                                            {transaction.discount_codes.join(
                                                ', ',
                                            )}
                                        </span>
                                    </div>
                                )}
                            <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-bold text-gray-900">
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
                            href="/"
                            className="inline-block rounded-md bg-black px-6 py-3 font-medium text-white uppercase transition-colors hover:bg-gray-800"
                        >
                            Continue Shopping
                        </Link>
                    </div>

                    <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Important:</strong> Please save your
                            reference IDs. You may still need to register to the event(s) and/or product(s) and might have to provide them in your form submission!
                        </p>
                    </div>
                </div>
            </div>
        </ShopLayout>
    );
}
