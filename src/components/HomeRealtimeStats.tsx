"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getLiveStatsAction } from "@/app/actions/voter";

const BROADCAST_CHANNEL = "vms-votes";

export default function HomeRealtimeStats({ initialTotal, initialVoted }: { initialTotal: number, initialVoted: number }) {
    const [totalCount, setTotalCount] = useState(initialTotal);
    const [votedCount, setVotedCount] = useState(initialVoted);
    const supabase = useRef(createClient()).current;

    useEffect(() => {
        const fetchStats = async () => {
            const stats = await getLiveStatsAction();
            setTotalCount(stats.total);
            setVotedCount(stats.voted);
        };

        const channel = supabase
            .channel(BROADCAST_CHANNEL)
            .on("broadcast", { event: "vote-update" }, () => {
                fetchStats();
            })
            .on("broadcast", { event: "stats-update" }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const percentage = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center text-center space-y-2 group">
                    <p className="text-muted-foreground font-bold uppercase tracking-normal text-[14px] flex items-center gap-2">
                        <Users className="w-3 h-3 text-primary" /> Total Registered
                    </p>
                    <p className="text-4xl font-semibold text-foreground tabular-nums tracking-tighter transition-all group-hover:scale-105">
                        {totalCount.toLocaleString()}
                    </p>
                </div>

                <div className="flex flex-col items-center text-center space-y-2 group">
                    <p className="text-muted-foreground font-bold uppercase tracking-normal text-[14px] flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Total Voted
                    </p>
                    <p className="text-6xl font-bold text-primary tabular-nums tracking-tighter transition-all group-hover:scale-105">
                        {votedCount.toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <div className="flex justify-between items-end mb-1">
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground/60 pb-1">Turnout Progress</h3>
                    <span className="text-xl font-bold text-primary tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                        {percentage}<span className="text-xl ml-0.5 opacity-50">%</span>
                    </span>
                </div>
                <div className="relative">
                    <Progress value={percentage} className="h-6 rounded-2xl shadow-[inner_0_2px_4px_rgba(0,0,0,0.05)] border-2 border-slate-100 bg-slate-50 overflow-hidden" />
                    {/* Add a decorative shine or gradient overlay if possible via className on Progress, 
                        but standard Progress component might need internal changes for complex gradients. 
                        I'll use a high-end color scheme. */}
                </div>

            </div>
        </div>
    );
}
