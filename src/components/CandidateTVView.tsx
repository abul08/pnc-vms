"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Progress } from "@/components/ui/progress";
import { getCandidateStatsAction, getLiveStatsAction } from "@/app/actions/voter";
import { ELECTION_CONFIG } from "@/lib/candidate-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, TrendingUp } from "lucide-react";

const BROADCAST_CHANNEL = "vms-votes";

export default function CandidateTVView({
    initialStats,
    initialTotal,
    initialVoted
}: {
    initialStats: Record<string, number>,
    initialTotal: number,
    initialVoted: number
}) {
    const [stats, setStats] = useState(initialStats);
    const [totalCount, setTotalCount] = useState(initialTotal);
    const [votedCount, setVotedCount] = useState(initialVoted);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const fetchAllData = async () => {
            const [newStats, turnout] = await Promise.all([
                getCandidateStatsAction(),
                getLiveStatsAction()
            ]);
            setStats(newStats);
            setTotalCount(turnout.total);
            setVotedCount(turnout.voted);
        };

        const channel = supabase
            .channel(BROADCAST_CHANNEL)
            .on("broadcast", { event: "vote-update" }, () => fetchAllData())
            .on("broadcast", { event: "stats-update" }, () => fetchAllData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const turnoutPercentage = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

    return (
        <div className="flex flex-col h-full gap-8 w-full">
            {/* Top Turnout Summary */}
            <div className="grid grid-cols-2 gap-8 shrink-0 h-32 xl:h-40">
                <Card className="border border-white/10 shadow-2xl bg-white/5 text-white overflow-hidden relative group rounded-[2rem] backdrop-blur-2xl">
                    <div className="absolute top-0 right-0 p-4 xl:p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                        <Users className="w-32 h-32 xl:w-48 xl:h-48" />
                    </div>
                    <CardContent className="p-6 xl:p-8 h-full flex flex-col justify-center relative z-10 w-full">
                        <div className="flex items-center justify-between mb-4 xl:mb-6">
                            <div className="flex items-center gap-4 xl:gap-5">
                                <div className="p-3 xl:p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 hidden sm:block">
                                    <Users className="w-6 h-6 xl:w-8 xl:h-8 text-white/80" />
                                </div>
                                <span className="text-lg xl:text-2xl font-black uppercase tracking-[0.3em] text-slate-300 drop-shadow-sm">Registered</span>
                            </div>
                            <span className="text-5xl xl:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-xl">{totalCount.toLocaleString()}</span>
                        </div>
                        <Progress value={100} className="h-3 xl:h-4 bg-white/10 rounded-full [&>div]:bg-white/80" />
                    </CardContent>
                </Card>

                <Card className="border border-primary/30 shadow-[0_0_40px_rgba(0,0,0,0.5)] bg-linear-to-br from-primary/80 to-primary/40 text-white overflow-hidden relative group rounded-[2rem] backdrop-blur-2xl">
                    <div className="absolute top-0 right-0 p-4 xl:p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                        <CheckCircle2 className="w-32 h-32 xl:w-48 xl:h-48" />
                    </div>
                    <CardContent className="p-6 xl:p-8 h-full flex flex-col justify-center relative z-10 w-full">
                        <div className="flex items-center justify-between mb-4 xl:mb-6">
                            <div className="flex items-center gap-4 xl:gap-5">
                                <div className="p-3 xl:p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 hidden sm:block">
                                    <CheckCircle2 className="w-6 h-6 xl:w-8 xl:h-8 text-white" />
                                </div>
                                <span className="text-lg xl:text-2xl font-black uppercase tracking-[0.3em] text-white/90 drop-shadow-md">Voted</span>
                            </div>
                            <div className="text-right flex items-baseline gap-3 xl:gap-4">
                                <span className="text-5xl xl:text-7xl font-black tabular-nums tracking-tighter text-white drop-shadow-2xl">{votedCount.toLocaleString()}</span>
                                <span className="text-2xl xl:text-4xl font-black opacity-80 hidden sm:inline drop-shadow-md">({turnoutPercentage}%)</span>
                            </div>
                        </div>
                        <Progress value={turnoutPercentage} className="h-3 xl:h-4 bg-black/20 rounded-full [&>div]:bg-white shadow-inner" />
                    </CardContent>
                </Card>
            </div>

            {/* Candidate Categories - 5 columns horizontally */}
            <div className="flex-1 min-h-0 flex gap-8 w-full">
                {ELECTION_CONFIG.map((group) => (
                    <div key={group.title} className="flex flex-col gap-5 min-w-0" style={{ flex: group.categories.length }}>
                        <div className="flex items-center gap-4 shrink-0 h-10 px-2">
                            <div className="h-full w-3 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.8)]" />
                            <h2 className="text-2xl xl:text-4xl font-black text-white uppercase tracking-widest drop-shadow-lg truncate">{group.title}</h2>
                        </div>

                        <div 
                            className="flex-1 min-h-0 grid gap-6"
                            style={{ gridTemplateColumns: `repeat(${group.categories.length}, minmax(0, 1fr))` }}
                        >
                            {group.categories.map((category) => (
                                <Card key={category.title} className="border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-slate-900/60 backdrop-blur-2xl overflow-hidden rounded-[2.5rem] flex flex-col h-full">
                                    <CardHeader className="bg-white/5 border-b border-white/10 py-5 xl:py-6 px-8 shrink-0 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent"></div>
                                        <CardTitle className="relative text-base xl:text-xl font-black uppercase tracking-[0.2em] text-slate-300 flex items-center gap-4 truncate">
                                            <TrendingUp className="w-5 h-5 xl:w-6 xl:h-6 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.8)] shrink-0" />
                                            {category.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 min-h-0 divide-y divide-white/5 p-0 flex flex-col">
                                        {category.candidates.map((candidate) => {
                                            const votes = stats[candidate.id] || 0;
                                            const progress = votedCount > 0 ? Math.round((votes / votedCount) * 100) : 0;

                                            return (
                                                <div key={candidate.id} className="flex-1 flex flex-col justify-center px-8 hover:bg-white/5 transition-all duration-500 group relative">
                                                    <div className="flex justify-between items-center mb-2 xl:mb-3 gap-3">
                                                        <div className="flex items-center gap-4 xl:gap-5 min-w-0">
                                                            <div className="h-12 w-12 xl:h-16 xl:w-16 shrink-0 rounded-2xl bg-slate-800 border-2 border-slate-700 shadow-inner flex items-center justify-center font-black text-2xl xl:text-3xl text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all duration-500">
                                                                {candidate.number}
                                                            </div>
                                                            <div className="truncate min-w-0">
                                                                <p className="text-xl xl:text-3xl font-black text-white group-hover:text-primary transition-colors tracking-tight truncate drop-shadow-md">{candidate.name}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <span className="text-4xl xl:text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">{votes.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 w-full">
                                                        <Progress value={progress} className="h-2 xl:h-3 flex-1 rounded-full bg-slate-800 shadow-inner overflow-hidden [&>div]:bg-primary transition-all duration-1000 ease-out" />
                                                        <span className="text-sm xl:text-xl font-black text-primary w-12 text-right drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]">{progress}%</span>
                                                    </div>
                                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-700" />
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
