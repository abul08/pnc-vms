import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { getUser, getProfile } from '@/utils/supabase/queries';
import { headers } from 'next/headers';
import { LogOut, BarChart3, Vote } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MobileNav } from './MobileNav';

export default async function Navbar() {
    const headerList = await headers();
    const pathname = headerList.get('x-pathname');

    if (pathname === '/login') return null;

    const supabase = await createClient();
    const user = await getUser(supabase);

    let role: string | null = null;
    let fullName: string | null = null;
    
    if (user) {
        const profile = await getProfile(supabase, user.id);
        role = profile?.role || null;
        fullName = profile?.full_name || null;
    }

    const dashboardHref =
        role === 'admin' ? '/admin' :
            role === 'manager' ? '/manager' :
                role === 'marker' ? '/marker' :
                    role === 'observer' ? '/observer' : '/';

    return (
        <>
            {/* Top bar */}
            <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
                <div className="flex h-14 items-center px-4 max-w-7xl mx-auto">
                    <Link href={dashboardHref} className="flex items-center gap-2 font-bold text-primary">
                        <Vote className="h-5 w-5" />
                        <span className="text-base">PNC VMS</span>
                    </Link>

                    {role === 'admin' && (
                        <div className="hidden sm:flex items-center ml-8 gap-1">
                            <Link href="/admin/candidates">
                                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Stats</span>
                                </Button>
                            </Link>
                        </div>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        {user && fullName && (
                            <span className="text-xs text-slate-700 font-semibold mr-2">{fullName}</span>
                        )}
                        {user ? (
                            <form action={async () => {
                                'use server';
                                const supabase = await createClient();
                                await supabase.auth.signOut();
                                redirect('/login');
                            }} className="hidden sm:block">
                                <Button variant="ghost" size="sm" type="submit" className="gap-1.5 text-muted-foreground">
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </Button>
                            </form>
                        ) : null}
                    </div>
                </div>
            </header>

            {/* Bottom tab bar — mobile only */}
            {user && role && role !== 'spectator' && <MobileNav role={role} />}
        </>
    );
}
