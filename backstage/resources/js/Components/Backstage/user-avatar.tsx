import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/Components/Shared/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type User } from '@/types';

interface UserAvatarProps {
    user: Pick<User, 'name' | 'avatar' | 'initials'>; // helper type to accept partial user
    className?: string;
    isOnline?: boolean;
}

export function UserAvatar({ user, className, isOnline }: UserAvatarProps) {
    // Fallback if 'initials' prop isn't provided (for legacy usage in other parts of app if any)
    const getInitials = useInitials();
    const initials = user.initials || getInitials(user.name);

    return (
        <div className={cn('relative inline-block', className)}>
            <Avatar className="h-8 w-8 rounded-full border-2 border-background">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                    {initials}
                </AvatarFallback>
            </Avatar>
            {isOnline && (
                <span className="absolute right-0 bottom-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
        </div>
    );
}
