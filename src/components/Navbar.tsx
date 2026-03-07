import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { LogOut, LayoutDashboard, Monitor, Vote, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default async function Navbar() {
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
            {user && role && (
                <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background border-t flex">
                    {role === 'admin' && (
                        <>
                            <Link href="/admin" className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-primary">
                                <LayoutDashboard className="w-5 h-5" />
                                <span className="text-[10px] font-semibold">Home</span>
                            </Link>
                            <Separator orientation="vertical" className="h-auto my-3" />
                            <Link href="/admin/users" className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-muted-foreground">
                                <Users className="w-5 h-5" />
                                <span className="text-[10px] font-semibold">Users</span>
                            </Link>
                            <Separator orientation="vertical" className="h-auto my-3" />
                            <Link href="/admin/voters" className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-muted-foreground">
                                <Vote className="w-5 h-5" />
                                <span className="text-[10px] font-semibold">Voters</span>
                            </Link>
                            <Separator orientation="vertical" className="h-auto my-3" />
                            <Link href="/admin/assignments" className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-muted-foreground">
                                <Monitor className="w-5 h-5" />
                                <span className="text-[10px] font-semibold">Assign</span>
                            </Link>
                        </>
                    )}
                    {role === 'manager' && (
                        <Link href="/manager" className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-primary">
                            <Monitor className="w-5 h-5" />
                            <span className="text-[10px] font-semibold">Patch View</span>
                        </Link>
                    )}
                    {role === 'marker' && (
                        <Link href="/marker" className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-primary">
                            <Vote className="w-5 h-5" />
                            <span className="text-[10px] font-semibold">My Voters</span>
                        </Link>
                    )}
                </nav>
            )}
        </>
    );
}
