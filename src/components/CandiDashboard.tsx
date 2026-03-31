"use client";

import CandidateTurnoutOnly from "./CandidateTurnoutOnly";
import { BoxTurnoutStats } from "@/app/actions/voter";

interface CandiDashboardProps {
    initialTotal: number;
    initialVoted: number;
    initialBoxStats: BoxTurnoutStats[];
}

export default function CandiDashboard({
    initialTotal,
    initialVoted,
    initialBoxStats,
}: CandiDashboardProps) {
    return (
        <div className="space-y-6 sm:space-y-10 pb-20 px-1 sm:px-0">
            <div className="space-y-6 sm:space-y-8 animate-reveal delay-100">
                <div className="pt-4 px-1 sm:px-0">
                    <CandidateTurnoutOnly
                        initialTotal={initialTotal}
                        initialVoted={initialVoted}
                        initialBoxStats={initialBoxStats}
                    />
                </div>
            </div>
        </div>
    );
}
