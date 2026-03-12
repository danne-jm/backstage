import type { Auth } from '@/types/auth';

declare global {
    interface Window {
        // Laravel Echo instance (optional – only available when broadcasting is configured)
        Echo?: {
            private(channel: string): {
                listen(event: string, callback: (data: any) => void): void;
            };
            leave(channel: string): void;
        };
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
