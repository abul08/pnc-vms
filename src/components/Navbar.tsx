import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import { LogOut, LayoutDashboard, Monitor, Vote, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MobileNav } from './MobileNav';

export default async function Navbar() {
    const headerList = await headers();
    const pathname = headerList.get('x-pathname');

    if (pathname === '/login') return null;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let role: string | null = null;
    let fullName: string | null = null;
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();
        role = profile?.role || null;
        fullName = profile?.full_name || null;
    }

    const dashboardHref =
        role === 'admin' ? '/admin' :
            role === 'manager' ? '/manager' :
                role === 'marker' ? '/marker' : '/';

    return (
        <>
            {/* Top bar */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
                <div className="flex h-14 items-center px-4 max-w-7xl mx-auto">
                    <Link href={dashboardHref} className="flex items-center gap-2 font-bold text-primary mr-auto">
                        <Vote className="h-5 w-5" />
                        <span className="text-base">VMS</span>
                    </Link>
                    {user && fullName && (
                        <span className="hidden sm:block text-xs text-muted-foreground font-medium mr-3">{fullName}</span>
                    )}
                    {user ? (
                        <form action={async () => {
                            'use server';
                            const supabase = await createClient();
                            await supabase.auth.signOut();
                            redirect('/login');
                        }}>
                            <Button variant="ghost" size="sm" type="submit" className="gap-1.5 text-muted-foreground">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Button>
                        </form>
                    ) : (
                        <Link href="/login" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                            Sign In
                        </Link>
                    )}
                </div>
            </header>

            {/* Bottom tab bar — mobile only */}
            {user && role && <MobileNav role={role} />}
        </>
    );
}
