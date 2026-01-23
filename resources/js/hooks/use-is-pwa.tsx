import { useEffect, useState } from 'react';

/**
 * Hook to detect if the app is running in PWA mode (standalone)
 */
export function useIsPWA(): boolean {
    const [isPWA, setIsPWA] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode (PWA)
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes('android-app://');

        setIsPWA(isStandalone);
    }, []);

    return isPWA;
}
