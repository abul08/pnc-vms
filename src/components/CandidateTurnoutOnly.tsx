"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Progress } from "@/components/ui/progress";
import { getLiveStatsAction, getBoxTurnoutStatsAction, type BoxTurnoutStats } from "@/app/actions/voter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin } from "lucide-react";

const BROADCAST_CHANNEL = "vms-votes";

export default function CandidateTurnoutOnly({
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
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const fetchAllData = async () => {
            const [turnout, newBoxStats] = await Promise.all([
                getLiveStatsAction(),
                getBoxTurnoutStatsAction()
            ]);
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
            {/* Top Turnout Summary */}
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
        </div>
    );
}
