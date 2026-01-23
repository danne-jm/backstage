import { useEffect, useState } from 'react';
import { getItem, setItem } from '@/lib/db';

/**
 * Hook for persisting state in IndexedDB (survives page reloads and app restarts)
 * 
 * @example
 * const [count, setCount] = usePersistedState('counter', 0);
 * const [user, setUser] = usePersistedState('user', { name: '', email: '' });
 */
export function usePersistedState<T>(
    key: string,
    initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load initial value from IndexedDB
    useEffect(() => {
        getItem<T>(key).then((value) => {
            if (value !== undefined) {
                setState(value);
            }
            setIsLoaded(true);
        });
    }, [key]);

    // Save to IndexedDB whenever state changes (after initial load)
    useEffect(() => {
        if (isLoaded) {
            setItem(key, state);
        }
    }, [key, state, isLoaded]);

    // Custom setState that handles both direct values and updater functions
    const setPersistedState = (value: T | ((prev: T) => T)) => {
        setState(value);
    };

    return [state, setPersistedState];
}
