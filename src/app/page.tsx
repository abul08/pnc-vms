import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { Vote, Users, CheckCircle2, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import Link from "next/link";
import HomeRealtimeStats from "@/components/HomeRealtimeStats";
import { getBoxTurnoutStatsAction, type BoxTurnoutStats } from "@/app/actions/voter";

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role === "admin") redirect("/admin");
        if (profile?.role === "observer") redirect("/observer");
        if (profile?.role === "candi") redirect("/candi");
    }

    let totalCount = 0;
    let votedCount = 0;
    let boxStats: BoxTurnoutStats[] = [];

    try {
        const adminSupabase = await createAdminClient();

        const [
            { data: stats, error: statsError },
            fetchedBoxStats
        ] = await Promise.all([
            adminSupabase.from("dashboard_stats").select("total_voters, voted_voters").single(),
            getBoxTurnoutStatsAction()
        ]);

        if (statsError) throw statsError;

        totalCount = stats.total_voters || 0;
        votedCount = stats.voted_voters || 0;
        boxStats = fetchedBoxStats || [];
    } catch (e) {
        console.error("Home page data fetch failed:", e);
    }

    return (
        <div className="flex-1 flex flex-col items-center p-4 py-6 md:p-24 space-y-12 bg-muted/30 min-h-[calc(100vh-3.5rem)]">

            <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium bg-background px-5 py-2.5 rounded-full border shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="flex items-center gap-1.5">
                    Live Real-time Dashboard
                </span>
            </div>

            <div className="text-center space-y-6 max-w-3xl mt-[-10px]">
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-foreground flex flex-col md:flex-row items-center justify-center gap-4">
                    Voter Monitor
                </h1>
                <p className="text-md text-muted-foreground">
                    Real-time monitoring of turnout across all polling stations and ballot boxes.
                </p>
            </div>

            <Card className="w-full max-w-4xl border-none shadow-lg bg-card overflow-hidden">
                <div className="h-2 w-full bg-linear-to-r from-primary to-green-500 mt-[-18px]" />
                <CardContent className="p-8 md:p-12">
                    <HomeRealtimeStats initialTotal={totalCount} initialVoted={votedCount} initialBoxStats={boxStats} />
                </CardContent>
            </Card>

        </div>
    );
}
