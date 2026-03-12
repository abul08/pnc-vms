"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProminentLogoutButton({ className }: { className?: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const supabase = createClient();

    const handleLogout = () => {
        startTransition(async () => {
            await supabase.auth.signOut();
            router.push("/login");
            router.refresh();
        });
    };

    return (
        <Button
            onClick={handleLogout}
            disabled={isPending}
            variant="outline"
            size="sm"
            className={cn("gap-2 rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all font-semibold", className)}
        >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <LogOut className="w-4 h-4" />}
            Sign Out
        </Button>
    );
}
