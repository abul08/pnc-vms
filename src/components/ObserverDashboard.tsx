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
                <Card className="border-none bg-card overflow-hidden rounded-3xl">
                    <div className="h-2 w-full bg-linear-to-r from-primary to-green-500" />
                    <CardContent className="p-4 sm:p-8 md:p-12">
                        <HomeRealtimeStats
                            initialTotal={initialTotal}
                            initialVoted={initialVoted}
                            initialBoxStats={initialBoxStats}
                        />
                    </CardContent>
                </Card>

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
