"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Users, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getLiveStatsAction, getBoxTurnoutStatsAction, type BoxTurnoutStats } from "@/app/actions/voter";

const BROADCAST_CHANNEL = "vms-votes";

export default function HomeRealtimeStats({ 
    initialTotal, 
    initialVoted,
    initialBoxStats = [], 
}: { 
    initialTotal: number, 
    initialVoted: number,
    initialBoxStats?: BoxTurnoutStats[]
}) {
    const [totalCount, setTotalCount] = useState(initialTotal);
    const [votedCount, setVotedCount] = useState(initialVoted);
    const [boxStats, setBoxStats] = useState<BoxTurnoutStats[]>(initialBoxStats);
    const supabase = useRef(createClient()).current;

    useEffect(() => {
        const fetchStats = async () => {
            const [stats, newBoxStats] = await Promise.all([
                getLiveStatsAction(),
                getBoxTurnoutStatsAction()
            ]);
            setTotalCount(stats.total);
            setVotedCount(stats.voted);
            setBoxStats(newBoxStats);
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
                </div>
            </div>

            {/* Box Turnout Progress */}
            {boxStats.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-slate-100/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-6 w-1.5 bg-green-500 rounded-full" />
                        <h3 className="text-lg font-bold text-slate-800 uppercase">Turnout by Box</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {boxStats.map((boxGroup, idx) => {
                            const groupProgress = boxGroup.total > 0 ? Math.round((boxGroup.voted / boxGroup.total) * 100) : 0;
                            return (
                                <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl overflow-hidden hover:bg-slate-50 transition-colors p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-1 max-w-[70%]">
                                            <h4 className="font-bold text-sm text-slate-800 leading-tight">
                                                {boxGroup.label}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                                {boxGroup.total.toLocaleString()} Registered
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="text-xl font-bold text-slate-700 tabular-nums leading-none">
                                                {boxGroup.voted.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded font-bold mt-1.5">
                                                {groupProgress}%
                                            </span>
                                        </div>
                                    </div>
                                    <Progress value={groupProgress} className="h-2 bg-slate-200/60 [&>div]:bg-green-500" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
