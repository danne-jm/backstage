import { Link, usePage } from '@inertiajs/react';
import {
    Facebook,
    Globe,
    Instagram,
    ShoppingBag,
    TreeDeciduous,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { useCart } from '@store/hooks/use-cart';

interface FooterConfig {
    linktree_url?: string;
    instagram_url?: string;
    facebook_url?: string;
    website_url?: string;
    tiktok_url?: string;
    copyright?: string;
}

export default function ShopLayout({ children }: PropsWithChildren) {
    const { cartCount } = useCart();
    const { footer } = usePage<{ footer: FooterConfig }>().props;

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <header className="border-b border-gray-200 bg-white print:border-none">
                <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8 print:justify-center print:py-4">
                    <div className="flex items-center">
                        <Link href="/">
                            <img
                                src="/images/BE-LEUV-ESN.webp"
                                alt="Association Logo"
                                className="h-14 w-auto sm:h-16 md:h-20 print:h-20"
                            />
                        </Link>
                    </div>

                    <nav className="no-print flex space-x-4">
                        <Link
                            href="/cart"
                            className="relative text-gray-900 hover:text-gray-600"
                        >
                            <span className="sr-only">Cart</span>
                            <ShoppingBag className="h-6 w-6 sm:h-6 sm:w-6" />
                            {cartCount > 0 && (
                                <div
                                    className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full"
                                    style={{
                                        background:
                                            'conic-gradient(#7ac143 0deg 90deg, #f47b20 90deg 180deg, #00aeef 180deg 270deg, #ec008c 270deg 360deg)',
                                    }}
                                >
                                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black">
                                        {cartCount}
                                    </span>
                                </div>
                            )}
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="mt-auto border-t border-gray-200 bg-gray-100 print:bg-white">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-center space-y-8">
                        <div className="flex items-center space-x-6">
                            {footer?.linktree_url && (
                                <a
                                    href={footer.linktree_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-500 hover:text-green-600"
                                >
                                    <span className="sr-only">Linktree</span>
                                    <TreeDeciduous className="h-6 w-6" color="black" />
                                </a>
                            )}
                            {footer?.facebook_url && (
                                <a
                                    href={footer.facebook_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black hover:text-gray-600"
                                >
                                    <span className="sr-only">Facebook</span>
                                    <Facebook className="h-6 w-6" color="black" />
                                </a>
                            )}
                            {footer?.website_url && (
                                <a
                                    href={footer.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    <span className="sr-only">Website</span>
                                    <Globe className="h-6 w-6" color="black" />
                                </a>
                            )}
                            {footer?.tiktok_url && (
                                <a
                                    href={footer.tiktok_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black hover:text-gray-600"
                                >
                                    <span className="sr-only">TikTok</span>
                                    <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                    </svg>
                                </a>
                            )}
                            {footer?.instagram_url && (
                                <a
                                    href={footer.instagram_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black hover:text-gray-600"
                                >
                                    <span className="sr-only">Instagram</span>
                                    <Instagram className="h-6 w-6" color="black" />
                                </a>
                            )}
                        </div>
                        <p className="text-center text-sm text-gray-500">
                            &copy; {new Date().getFullYear()}{' '}
                            {footer?.copyright || ''}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
