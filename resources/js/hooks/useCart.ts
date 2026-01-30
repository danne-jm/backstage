import { useEffect, useState } from 'react';

export interface CartEntry {
    id: string;
    type: 'product' | 'event';
    quantity: number;
    options?: Record<string, string>;
}

// This interface is for hydrated cart items (with full data)
export interface CartItem extends CartEntry {
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    member_price?: number;
}

const STORAGE_KEY = 'shop_cart_v2';

export function useCart() {
    const [entries, setEntries] = useState<CartEntry[]>([]);

    useEffect(() => {
        const loadCart = () => {
            const storedCart = localStorage.getItem(STORAGE_KEY);
            if (storedCart) {
                try {
                    setEntries(JSON.parse(storedCart));
                } catch {
                    setEntries([]);
                }
            }
        };

        loadCart();

        const handleCartUpdate = () => loadCart();

        window.addEventListener('cart-updated', handleCartUpdate);
        window.addEventListener('storage', handleCartUpdate);

        return () => {
            window.removeEventListener('cart-updated', handleCartUpdate);
            window.removeEventListener('storage', handleCartUpdate);
        };
    }, []);

    const saveCart = (newEntries: CartEntry[]) => {
        setEntries(newEntries);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
        window.dispatchEvent(new Event('cart-updated'));
    };

    const addToCart = (item: {
        id: string;
        type: 'product' | 'event';
        quantity: number;
        options?: Record<string, string>;
    }) => {
        // Calculate current total cart count
        const currentTotal = entries.reduce((acc, e) => acc + e.quantity, 0);
        const existingIndex = entries.findIndex(
            (e) =>
                e.id === item.id &&
                e.type === item.type &&
                JSON.stringify(e.options || {}) ===
                JSON.stringify(item.options || {}),
        );

        let newTotal;
        if (existingIndex > -1) {
            newTotal = currentTotal + item.quantity;
        } else {
            newTotal = currentTotal + item.quantity;
        }
        if (newTotal > 20) {
            alert('You can only add up to 20 items to your cart.');
            return;
        }

        if (existingIndex > -1) {
            const newEntries = [...entries];
            newEntries[existingIndex].quantity += item.quantity;
            saveCart(newEntries);
        } else {
            saveCart([
                ...entries,
                {
                    id: item.id,
                    type: item.type,
                    quantity: item.quantity,
                    options: item.options,
                },
            ]);
        }
    };

    const removeFromCart = (
        id: string,
        type: 'product' | 'event',
        options?: Record<string, string>,
    ) => {
        const newEntries = entries.filter(
            (e) =>
                !(
                    e.id === id &&
                    e.type === type &&
                    JSON.stringify(e.options || {}) ===
                    JSON.stringify(options || {})
                ),
        );
        saveCart(newEntries);
    };

    const updateQuantity = (
        id: string,
        type: 'product' | 'event',
        quantity: number,
        options?: Record<string, string>,
    ) => {
        if (quantity < 1) return;
        // Calculate what the new total would be if this item's quantity is updated
        const currentEntry = entries.find(
            (e) =>
                e.id === id &&
                e.type === type &&
                JSON.stringify(e.options || {}) === JSON.stringify(options || {})
        );
        const currentQty = currentEntry ? currentEntry.quantity : 0;
        const currentTotal = entries.reduce((acc, e) => acc + e.quantity, 0);
        const newTotal = currentTotal - currentQty + quantity;
        if (newTotal > 20) {
            alert('You can only have up to 20 items in your cart.');
            return;
        }
        const newEntries = entries.map((e) => {
            if (
                e.id === id &&
                e.type === type &&
                JSON.stringify(e.options || {}) ===
                JSON.stringify(options || {})
            ) {
                return { ...e, quantity };
            }
            return e;
        });
        saveCart(newEntries);
    };

    const clearCart = () => {
        setEntries([]);
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('cart-updated'));
    };

    const cartCount = entries.reduce((acc, e) => acc + e.quantity, 0);

    return {
        entries,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
    };
}
