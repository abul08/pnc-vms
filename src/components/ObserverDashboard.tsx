"use client";

import { Card, CardContent } from "@/components/ui/card";
import HomeRealtimeStats from "./HomeRealtimeStats";
import CandidateProgress from "./CandidateProgress";
import { BoxTurnoutStats } from "@/app/actions/voter";

interface ObserverDashboardProps {
    initialTotal: number;
    initialVoted: number;
    initialBoxStats: BoxTurnoutStats[];
    initialCandidateStats: Record<string, number>;
}

export default function ObserverDashboard({
    initialTotal,
    initialVoted,
    initialBoxStats,
    initialCandidateStats
}: ObserverDashboardProps) {
    return (
        <div className="space-y-6 sm:space-y-10 pb-20 px-1 sm:px-0">
            {/* Statistics Section */}
            <div className="space-y-6 sm:space-y-8 animate-reveal delay-100">

                <div className="pt-4 px-1 sm:px-0">
                    <CandidateProgress
                        initialStats={initialCandidateStats}
                        initialTotal={initialTotal}
                        initialVoted={initialVoted}
                        initialBoxStats={initialBoxStats}
                    />
                </div>
            </div>
        </div>
    );
}
