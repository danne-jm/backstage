import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/backstage.tsx', 'resources/js/store.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
        VitePWA({
            // Don't auto-inject — we register manually in backstage.tsx only
            injectRegister: false,
            registerType: 'autoUpdate',
            // Output SW and manifest to the webroot so the SW scope covers '/'
            // The build assets remain in public/build/ as normal
            outDir: 'public',
            filename: 'sw.js',
            manifestFilename: 'pwa-manifest.webmanifest',
            manifest: {
                name: 'Backstage',
                short_name: 'Backstage',
                description: 'ESN Leuven backstage management panel',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/dashboard',
                scope: '/',
                background_color: '#ffffff',
                theme_color: '#0a0a0a',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                    {
                        src: '/favicon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                ],
            },
            workbox: {
                // Cache JS, CSS and small images (hash-named — safe to pre-cache)
                globPatterns: ['**/*.{js,css,woff,woff2}'],
                // Exclude large/binary assets from pre-cache
                globIgnores: ['**/images/**', '**/*.map'],
                // Allow up to 5 MiB per file in the pre-cache manifest
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                navigateFallback: null,
                runtimeCaching: [
                    {
                        // Fonts from bunny.net
                        urlPattern: /^https:\/\/fonts\.bunny\.net\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                            cacheableResponse: { statuses: [0, 200] },
                        },
                    },
                    {
                        // All same-origin navigation (Inertia pages) — network first, fall back to cache
                        urlPattern: ({ request }) => request.mode === 'navigate',
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'pages-cache',
                            networkTimeoutSeconds: 5,
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
            '@backstage': resolve(__dirname, 'resources/js/backstage'),
            '@store': resolve(__dirname, 'resources/js/online-store'),
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
});
