import { useUserPresence } from '@/contexts/user-presence-context';

/**
 * Hook for real-time user presence tracking via WebSocket.
 * Uses the global UserPresenceContext to avoid reloading on navigation.
 */
export function useOnlineUsers() {
    const { onlineUsers } = useUserPresence();
    return onlineUsers;
}
