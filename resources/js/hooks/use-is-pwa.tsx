import { useSyncExternalStore } from 'react';

/**
 * Hook to detect if the app is running in PWA mode (standalone)
 */
export function useIsPWA(): boolean {
    return useSyncExternalStore(
        // Subscribe function - PWA status doesn't change after initial load
        () => () => {},
        // Snapshot function for client
        () =>
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean })
                .standalone === true ||
            document.referrer.includes('android-app://'),
        // Snapshot function for server (SSR)
        () => false,
    );
}
