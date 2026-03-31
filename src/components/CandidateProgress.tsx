"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Progress } from "@/components/ui/progress";
import { getCandidateStatsAction, getLiveStatsAction, getBoxTurnoutStatsAction, type BoxTurnoutStats } from "@/app/actions/voter";
import { ELECTION_CONFIG } from "@/lib/candidate-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, TrendingUp, MapPin } from "lucide-react";

const BROADCAST_CHANNEL = "vms-votes";

export default function CandidateProgress({
    initialStats,
    initialTotal,
    initialVoted,
    initialBoxStats = [], // Provide default for existing calls
}: {
    initialStats: Record<string, number>,
    initialTotal: number,
    initialVoted: number,
    initialBoxStats?: BoxTurnoutStats[]
}) {
    const [stats, setStats] = useState(initialStats);
    const [totalCount, setTotalCount] = useState(initialTotal);
    const [votedCount, setVotedCount] = useState(initialVoted);
    const [boxStats, setBoxStats] = useState<BoxTurnoutStats[]>(initialBoxStats);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const fetchAllData = async () => {
            const [newStats, turnout, newBoxStats] = await Promise.all([
                getCandidateStatsAction(),
                getLiveStatsAction(),
                getBoxTurnoutStatsAction()
            ]);
            setStats(newStats);
            setTotalCount(turnout.total);
            setVotedCount(turnout.voted);
            setBoxStats(newBoxStats);
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
        <div className="space-y-8 sm:space-y-12">
            {/* Top Turnout Summary (Mirrors Home) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Card className="border-none flex shadow-sm bg-slate-50/50 rounded-2xl">
                    <CardContent className=" sm:pt-6 sm:pb-6 pr-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                </div>
                                <span className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground transition-all">Registered</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-medium tabular-nums">{totalCount.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between sm:mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                </div>
                                <span className="text-[14px] font-semibold uppercase tracking-wider text-muted-foreground transition-all">Voted</span>
                            </div>
                            <div className="text-right flex items-center">
                                <span className="text-xl sm:text-2xl font-medium tabular-nums text-primary">{votedCount.toLocaleString()}</span>
                                <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground  ml-1.5">({turnoutPercentage}%)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Box Turnout Progress */}
            {boxStats.length > 0 && (
                <div className="space-y-5 sm:space-y-6">
                    <div className="flex items-center gap-4 px-1">
                        <div className="h-6 sm:h-8 w-1.5 bg-blue-500 rounded-full" />
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-600 uppercase tracking-normal">Turnout by Box</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {boxStats.map((boxGroup, idx) => {
                            const groupProgress = boxGroup.total > 0 ? Math.round((boxGroup.voted / boxGroup.total) * 100) : 0;
                            return (
                                <Card key={idx} className="border-slate-100 shadow-sm overflow-hidden bg-white hover:bg-slate-50/50 transition-colors rounded-2xl">
                                    <CardContent className="p-4 sm:p-6 text-base">
                                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                                            <div className="flex items-center gap-2.5 sm:gap-3">
                                                <div className="p-2 sm:p-2.5 bg-blue-500/10 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-700 leading-normal text-sm sm:text-base">
                                                        {boxGroup.label}
                                                    </h3>
                                                    <p className="text-[9px] sm:text-xs text-slate-500 font-medium mt-0.5 sm:mt-1 uppercase tracking-wider">
                                                        {boxGroup.total.toLocaleString()} Registered
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                                    <span className="text-xl sm:text-2xl font-bold text-slate-700 tabular-nums leading-none">
                                                        {boxGroup.voted.toLocaleString()}
                                                    </span>
                                                    <Badge variant="outline" className="font-semibold border-blue-200 text-blue-700 bg-blue-50 text-[10px] sm:text-xs h-5 sm:h-6 p-1 px-1.5 ">
                                                        {groupProgress}%
                                                    </Badge>
                                                </div>
                                                <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium mt-1 uppercase">Voted</p>
                                            </div>
                                        </div>
                                        <Progress value={groupProgress} className="h-2 sm:h-2.5 bg-slate-100 [&>div]:bg-blue-200" />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Candidate Categories */}
            {ELECTION_CONFIG.map((group) => (
                <div key={group.title} className="space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-4 px-1">
                        <div className="h-6 sm:h-8 w-1.5 bg-primary rounded-full" />
                        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 uppercase tracking-normal">{group.title} Results</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        {group.categories.map((category) => (
                            <Card key={category.title} className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="text-sm font-semibold uppercase tracking-normal text-slate-500 flex items-center justify-center gap-2 pt-2 mb-[-10px]">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {category.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y divide-slate-50 p-0">
                                    {category.candidates.map((candidate) => {
                                        const votes = stats[candidate.id] || 0;
                                        const progress = votedCount > 0 ? Math.round((votes / votedCount) * 100) : 0;

                                        return (
                                            <div key={candidate.id} className="px-4 sm:px-6 py-3 sm:py-4 space-y-2.5 sm:space-y-3 hover:bg-slate-50/30 transition-colors group">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-2.5 sm:gap-3">
                                                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center font-bold text-base sm:text-lg text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                            {candidate.number}
                                                        </div>
                                                        <div>

                                                            <p className="font-semibold text-[16px] text-slate-600 group-hover:text-primary transition-colors leading-tight">{candidate.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
                                                            <span className="text-lg sm:text-xl font-bold text-slate-600 tabular-nums">{votes.toLocaleString()}</span>
                                                            <Badge variant="outline" className="h-5 text-[9px] sm:text-[10px] font-bold text-slate-600 bg-white border-slate-200">{progress}%</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Progress value={progress} className="h-1.5 sm:h-2 rounded-full overflow-hidden bg-slate-100" />
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
    );
}
