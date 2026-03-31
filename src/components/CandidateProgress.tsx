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
    const supabase = useRef(createClient()).current;

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
        <div className="space-y-12">
            {/* Top Turnout Summary (Mirrors Home) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-slate-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Users className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Registered</span>
                            </div>
                            <span className="text-2xl font-medium tabular-nums">{totalCount.toLocaleString()}</span>
                        </div>
                        <Progress value={100} className="h-1.5 bg-slate-200" />
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Voted</span>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-medium tabular-nums text-primary">{votedCount.toLocaleString()}</span>
                                <span className="text-xs font-bold text-muted-foreground ml-2">({turnoutPercentage}%)</span>
                            </div>
                        </div>
                        <Progress value={turnoutPercentage} className="h-1.5 bg-slate-200 [&>div]:bg-green-500" />
                    </CardContent>
                </Card>
            </div>

            {/* Box Turnout Progress */}
            {boxStats.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1.5 bg-green-500 rounded-full" />
                        <h2 className="text-2xl font-bold text-slate-800 uppercase">Turnout by Box</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {boxStats.map((boxGroup, idx) => {
                            const groupProgress = boxGroup.total > 0 ? Math.round((boxGroup.voted / boxGroup.total) * 100) : 0;
                            return (
                                <Card key={idx} className="border-slate-100 shadow-sm overflow-hidden bg-white hover:bg-slate-50/50 transition-colors">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-green-500/10 rounded-xl text-green-600">
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 leading-tight">
                                                        {boxGroup.label}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                                                        {boxGroup.total.toLocaleString()} Registered
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-baseline justify-end gap-2">
                                                    <span className="text-2xl font-bold text-slate-700 tabular-nums leading-none">
                                                        {boxGroup.voted.toLocaleString()}
                                                    </span>
                                                    <Badge variant="outline" className="font-bold border-green-200 text-green-700 bg-green-50">
                                                        {groupProgress}%
                                                    </Badge>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">Voted</p>
                                            </div>
                                        </div>
                                        <Progress value={groupProgress} className="h-2.5 bg-slate-100 [&>div]:bg-green-500" />
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Candidate Categories */}
            {ELECTION_CONFIG.map((group) => (
                <div key={group.title} className="space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1.5 bg-primary rounded-full" />
                        <h2 className="text-2xl font-bold text-slate-800 uppercase">{group.title} Progress</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {group.categories.map((category) => (
                            <Card key={category.title} className="border-slate-100 shadow-sm overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center mt-4 gap-2">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        {category.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="divide-y divide-slate-50 p-0">
                                    {category.candidates.map((candidate) => {
                                        const votes = stats[candidate.id] || 0;
                                        const progress = votedCount > 0 ? Math.round((votes / votedCount) * 100) : 0;

                                        return (
                                            <div key={candidate.id} className="px-6 py-2 mb-2 space-y-3 hover:bg-slate-50/30 transition-colors group">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center font-semibold text-lg text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                            {candidate.number}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase font-medium text-slate-400">Candidate</p>
                                                            <p className="font-semibold text-slate-800 group-hover:text-primary transition-colors">{candidate.name}</p>

                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-2 justify-end">
                                                            <span className="text-xl font-semibold text-slate-600 tabular-nums">{votes.toLocaleString()}</span>
                                                            <Badge variant="outline" className="h-5 text-[10px] font-bold bg-white">{progress}%</Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Progress value={progress} className="h-2 rounded-full overflow-hidden bg-slate-100" />
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
