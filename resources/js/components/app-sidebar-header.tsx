import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { type ReactNode } from 'react'; // New import

export function AppSidebarHeader({
    breadcrumbs = [],
    headerActions, // New prop
}: {
    breadcrumbs?: BreadcrumbItemType[];
    headerActions?: ReactNode; // New prop
}) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-4">
                {/* Online Users Display */}
                <OnlineUsersList />

                {/* Render headerActions on the right */}
                {headerActions && <div>{headerActions}</div>}
            </div>
        </header>
    );
}

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { useInitials } from '@/hooks/use-initials';

function OnlineUsersList() {
    const { onlineUsers } = usePage<SharedData>().props;
    const getInitials = useInitials();

    if (!onlineUsers || onlineUsers.length === 0) return null;

    return (
        <div className="flex items-center gap-1 overflow-hidden mr-2">
            <TooltipProvider delayDuration={0}>
                {onlineUsers.map((user) => (
                    <Tooltip key={user.id}>
                        <TooltipTrigger asChild>
                            <div className="relative inline-block cursor-help transition-transform hover:z-10 hover:scale-110">
                                <Avatar className="h-8 w-8 rounded-full border-2 border-background">
                                    {/* <AvatarImage src={user.avatar} /> */}
                                    <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{user.name}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
}
