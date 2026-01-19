import { User } from '@/types';
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
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

    useEffect(() => {
        if (!user || typeof window === 'undefined' || !window.Echo) {
            return;
        }

        const userId = user.id;

        window.Echo.join('presence.users')
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

        return () => {
            window.Echo.leave('presence.users');
        };
    }, [user?.id]); // Only re-subscribe if user ID changes

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
