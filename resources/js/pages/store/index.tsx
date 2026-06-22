import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function StoreIndex({ events, products }: any) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Store', href: '/' }]}>
            <Head title="Store" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow-sm sm:rounded-lg dark:bg-zinc-900">
                        <h2 className="mb-4 text-2xl font-bold">ESN Store</h2>
                        <p>
                            Welcome to the ESN Store! This page is currently
                            under construction.
                        </p>

                        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <h3 className="mb-3 text-xl font-semibold">
                                    Events
                                </h3>
                                <ul className="space-y-2">
                                    {events?.map((event: any) => (
                                        <li
                                            key={event.id}
                                            className="rounded border p-4"
                                        >
                                            <strong>{event.name}</strong> - €
                                            {event.price_without_membership}
                                        </li>
                                    ))}
                                    {(!events || events.length === 0) && (
                                        <p className="text-muted-foreground">
                                            No events available right now.
                                        </p>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h3 className="mb-3 text-xl font-semibold">
                                    Products
                                </h3>
                                <ul className="space-y-2">
                                    {products?.map((product: any) => (
                                        <li
                                            key={product.id}
                                            className="rounded border p-4"
                                        >
                                            <strong>{product.name}</strong> - €
                                            {product.price}
                                        </li>
                                    ))}
                                    {(!products || products.length === 0) && (
                                        <p className="text-muted-foreground">
                                            No products available right now.
                                        </p>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
