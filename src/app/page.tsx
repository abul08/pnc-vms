import { createClient } from "@/utils/supabase/server";
import { Vote, Users, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const revalidate = 60; // Revalidate every minute for public dashboard

export default async function Home() {
    const supabase = await createClient();

    let totalCount = 0;
    let votedCount = 0;

    try {
        const { count: tc, error: tErr } = await supabase
            .from("voters")
            .select("*", { count: "exact", head: true });

        if (!tErr) totalCount = tc || 0;

        const { count: vc, error: vErr } = await supabase
            .from("voters")
            .select("*", { count: "exact", head: true })
            .eq("vote_status", true);

        if (!vErr) votedCount = vc || 0;
    } catch (e) { }

    const percentage = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

    return (
        <div className="flex-1 flex flex-col items-center p-4 py-8 md:p-24 space-y-12 bg-muted/30 min-h-[calc(100vh-3.5rem)]">
            <div className="text-center space-y-6 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-2 animate-in fade-in slide-in-from-top-4">
                    <Clock className="w-3 h-3" /> Election Live
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground flex flex-col md:flex-row items-center justify-center gap-4">
                    Voter Monitor
                </h1>
                <p className="text-lg text-muted-foreground px-4">
                    Real-time monitoring of turnout across all polling stations and ballot boxes.
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-2">
                    <Link
                        href="/login"
                        className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        Access System <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                </div>
            </div>

            <Card className="w-full max-w-4xl border-none shadow-2xl bg-card overflow-hidden">
                <div className="h-2 w-full bg-linear-to-r from-primary to-green-500" />
                <CardContent className="p-8 md:p-12 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2 group">
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <Users className="w-3 h-3 text-primary" /> Total Registered
                            </p>
                            <p className="text-6xl font-black text-foreground tabular-nums tracking-tighter transition-all group-hover:scale-105 origin-left">
                                {totalCount.toLocaleString()}
                            </p>
                        </div>

                        <div className="space-y-2 group">
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 justify-start md:justify-end">
                                Total Voted <CheckCircle2 className="w-3 h-3 text-green-500" />
                            </p>
                            <p className="text-6xl font-black text-primary tabular-nums tracking-tighter text-left md:text-right transition-all group-hover:scale-105 origin-right">
                                {votedCount.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex justify-between items-end mb-1">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Turnout Progress</h3>
                            <span className="text-3xl font-black text-foreground italic">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-10 rounded-xl shadow-inner border bg-muted" />
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            <span>0% Poll Start</span>
                            <span>100% Target Completion</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium bg-background px-5 py-2.5 rounded-full border shadow-xs">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span>Live data updates every 60 seconds</span>
            </div>
        </div>
    );
}
