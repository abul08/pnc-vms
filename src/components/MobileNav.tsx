"use client";

import { useTransition, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Monitor, Vote, Users, LogOut, BarChart3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

interface NavItemProps {
    href?: string;
    icon: any;
    label: string;
    isActive?: boolean;
    onClick?: (e: React.MouseEvent) => void;
    isPending?: boolean;
}

function MobileNavItem({ href, icon: Icon, label, isActive, onClick, isPending: externalPending }: NavItemProps) {
    const router = useRouter();
    const [localPending, startTransition] = useTransition();
    const isPending = externalPending || localPending;

    const handleClick = (e: React.MouseEvent) => {
        if (isActive || isPending) return;
        if (onClick) {
            onClick(e);
            return;
        }
        if (!href) return;
        e.preventDefault();
        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all relative",
                isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
            )}
        >
            {isPending ? (
                <>
                    <Skeleton className="w-5 h-5 rounded-full bg-primary/20" />
                    <Skeleton className="w-8 h-2 mt-1 bg-primary/20" />
                </>
            ) : (
                <>
                    <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                    <span className="text-[10px] font-semibold">{label}</span>
                </>
            )}

            {isActive && !isPending && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary animate-reveal" />
            )}
        </button>
    );
}

export function MobileNav({ role }: { role: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoggingOut, startLogout] = useTransition();
    const supabase = createClient();

    // Prefetch all possible navigation targets
    useEffect(() => {
        if (role === 'admin') {
            router.prefetch('/admin');
            router.prefetch('/admin/users');
            router.prefetch('/admin/voters');
            router.prefetch('/admin/assignments');
            router.prefetch('/admin/candidates');
        } else if (role === 'manager') {
            router.prefetch('/');
            router.prefetch('/manager');
        } else if (role === 'marker') {
            router.prefetch('/');
            router.prefetch('/marker');
        } else if (role === 'observer') {
            router.prefetch('/');
            router.prefetch('/observer');
        }
    }, [role, router]);

    const handleLogout = () => {
        startLogout(async () => {
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh();
        });
    };

    const checkActive = (path: string) => {
        if (path === '/' || path === '/admin') {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const isMarker = role === 'marker';
    const isObserver = role === 'observer';

    if (!isAdmin && !isManager && !isMarker && !isObserver) return null;

    return (
        <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t flex safe-bottom">
            {isAdmin && (
                <>
                    <MobileNavItem href="/admin" icon={LayoutDashboard} label="Home" isActive={checkActive('/admin')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem href="/admin/users" icon={Users} label="Users" isActive={checkActive('/admin/users')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem href="/admin/voters" icon={Vote} label="Voters" isActive={checkActive('/admin/voters')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem href="/admin/candidates" icon={BarChart3} label="Stats" isActive={checkActive('/admin/candidates')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem href="/admin/assignments" icon={Monitor} label="Assign" isActive={checkActive('/admin/assignments')} />
                    <Separator orientation="vertical" className="h-auto my-3 shrink-0" />
                    <MobileNavItem icon={LogOut} label="Out" onClick={handleLogout} isPending={isLoggingOut} />
                </>
            )}

            {isManager && (
                <>
                    <MobileNavItem href="/" icon={LayoutDashboard} label="Home" isActive={checkActive('/')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem href="/manager" icon={Monitor} label="Patch View" isActive={checkActive('/manager')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem icon={LogOut} label="Out" onClick={handleLogout} isPending={isLoggingOut} />
                </>
            )}

            {isMarker && (
                <>
                    <MobileNavItem href="/" icon={LayoutDashboard} label="Home" isActive={checkActive('/')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem href="/marker" icon={Vote} label="My Voters" isActive={checkActive('/marker')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem icon={LogOut} label="Out" onClick={handleLogout} isPending={isLoggingOut} />
                </>
            )}

            {isObserver && (
                <>
                    <MobileNavItem href="/" icon={LayoutDashboard} label="Home" isActive={checkActive('/')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem href="/observer" icon={BarChart3} label="Dashboard" isActive={checkActive('/observer')} />
                    <Separator orientation="vertical" className="h-auto my-3" />
                    <MobileNavItem icon={LogOut} label="Out" onClick={handleLogout} isPending={isLoggingOut} />
                </>
            )}
        </nav>
    );
}
