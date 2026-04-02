import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const backstagePages = import.meta.glob('./backstage/pages/**/*.tsx', { eager: true });
const storePages    = import.meta.glob('./online-store/pages/**/*.tsx', { eager: true });

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => (title ? `${title} - ${appName}` : appName),
        resolve: (name) => {
            const bp = `./backstage/pages/${name}.tsx`;
            const sp = `./online-store/pages/${name}.tsx`;
            if (bp in backstagePages) return backstagePages[bp] as any;
            if (sp in storePages) return storePages[sp] as any;
            throw new Error(`Page not found: ${name}`);
        },
        setup: ({ App, props }) => {
            return <App {...props} />;
        },
    }),
);
