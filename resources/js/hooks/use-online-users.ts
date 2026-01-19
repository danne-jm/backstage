import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface OnlineUser {
    id: number;
    name: string;
    initials: string;
}

/**
 * Hook for real-time user presence tracking via WebSocket.
 * Uses Laravel Echo presence channel to track online users.
 */
export function useOnlineUsers(): OnlineUser[] {
    const { auth } = usePage<SharedData>().props;
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

    useEffect(() => {
        // Only join if user is authenticated and Echo is available
        if (!auth?.user || typeof window === 'undefined' || !window.Echo) {
            return;
        }

        const userId = auth.user.id;

        window.Echo.join('presence.users')
            .here((users: OnlineUser[]) => {
                // Initial list of all users in the channel, excluding current user
                setOnlineUsers(users.filter((u) => u.id !== userId));
            })
            .joining((user: OnlineUser) => {
                // A new user joined the channel
                setOnlineUsers((prev) => {
                    if (prev.some((u) => u.id === user.id)) return prev;
                    if (user.id === userId) return prev;
                    return [...prev, user];
                });
            })
            .leaving((user: OnlineUser) => {
                // A user left the channel
                setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id));
            });

        return () => {
            window.Echo.leave('presence.users');
        };
    }, [auth?.user]);

    return onlineUsers;
}
