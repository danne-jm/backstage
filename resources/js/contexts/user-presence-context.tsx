import { User } from '@/types';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

interface OnlineUser {
    id: number;
    name: string;
    initials: string;
}

interface UserPresenceContextType {
    onlineUsers: OnlineUser[];
}

const UserPresenceContext = createContext<UserPresenceContextType | undefined>(
    undefined,
);

interface UserPresenceProviderProps {
    children: ReactNode;
    user: User | null;
}

export function UserPresenceProvider({
    children,
    user,
}: UserPresenceProviderProps) {
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const channelRef = useRef<ReturnType<typeof window.Echo.join> | null>(null);
    const boundRef = useRef(false);

    const subscribeToPresence = useCallback(() => {
        if (!window.Echo || !user) return;

        const userId = user.id;

        // Leave any existing subscription first to avoid duplicates
        if (channelRef.current) {
            try {
                window.Echo.leave('presence.users');
            } catch {
                // Ignore errors from leaving non-existent channel
            }
        }

        channelRef.current = window.Echo.join('presence.users')
            .here((users: OnlineUser[]) => {
                setOnlineUsers(users.filter((u) => u.id !== userId));
            })
            .joining((joinedUser: OnlineUser) => {
                setOnlineUsers((prev) => {
                    if (prev.some((u) => u.id === joinedUser.id)) return prev;
                    if (joinedUser.id === userId) return prev;
                    return [...prev, joinedUser];
                });
            })
            .leaving((leftUser: OnlineUser) => {
                setOnlineUsers((prev) =>
                    prev.filter((u) => u.id !== leftUser.id),
                );
            });
    }, [user]);

    useEffect(() => {
        if (!user || typeof window === 'undefined') {
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let cleanupCalled = false;

        const initSocket = () => {
            if (cleanupCalled) return;

            if (!window.Echo) {
                timeoutId = setTimeout(initSocket, 100);
                return;
            }

            const pusher = window.Echo.connector?.pusher;

            if (pusher) {
                // Force connect if not already connected
                pusher.connect();

                // Bind to state changes for reconnection handling
                if (!boundRef.current) {
                    boundRef.current = true;

                    pusher.connection.bind('connected', () => {
                        // Re-subscribe when connection is established
                        subscribeToPresence();
                    });

                    pusher.connection.bind('disconnected', () => {
                        setOnlineUsers([]);
                    });
                }

                // Initial subscription
                if (pusher.connection.state === 'connected') {
                    subscribeToPresence();
                }
            } else {
                // Fallback: just subscribe directly
                subscribeToPresence();
            }
        };

        initSocket();

        return () => {
            cleanupCalled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (window.Echo) {
                try {
                    window.Echo.leave('presence.users');
                } catch {
                    // Ignore
                }
            }
            channelRef.current = null;
        };
    }, [user?.id, subscribeToPresence]);

    return (
        <UserPresenceContext.Provider value={{ onlineUsers }}>
            {children}
        </UserPresenceContext.Provider>
    );
}

export function useUserPresence() {
    const context = useContext(UserPresenceContext);
    if (context === undefined) {
        throw new Error(
            'useUserPresence must be used within a UserPresenceProvider',
        );
    }
    return context;
}
