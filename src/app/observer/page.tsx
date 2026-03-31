import { createClient } from "@/utils/supabase/server";
import { getUser, getProfile } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";
import {
    getLiveStatsAction,
    getCandidateStatsAction,
    getBoxTurnoutStatsAction
} from "@/app/actions/voter";
import ObserverDashboard from "@/components/ObserverDashboard";
import { BarChart3, Search } from "lucide-react";
import VoterBoxLookup from "@/components/VoterBoxLookup";

export default async function ObserverPage() {
    const supabase = await createClient();
    const user = await getUser(supabase);
    if (!user) redirect("/login");

    const profile = await getProfile(supabase, user.id);
    if (!profile) redirect("/login");

    // Allow Admins and Observers to see this view
    const allowedRoles = ["admin", "observer"];
    if (!allowedRoles.includes(profile.role)) {
        redirect("/");
    }

    // Concurrent fetch for initial dashboard state
    const [stats, candidateStats, boxStats] = await Promise.all([
        getLiveStatsAction(),
        getCandidateStatsAction(),
        getBoxTurnoutStatsAction()
    ]);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-reveal">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex flex-col items-center gap-2 text-primary font-semibold uppercase tracking-widest text-[10px]">
                        Observer Dashboard
                    </div>
                    <h1 className="text-3xl md:text-4xl font-semibold text-slate-700 tracking-tight flex items-center gap-3">
                        Live Monitoring
                    </h1>
                </div>



            </div>
            <div>
                <VoterBoxLookup label="Check Registered Box" />
            </div>

            <ObserverDashboard
                initialTotal={stats.total}
                initialVoted={stats.voted}
                initialBoxStats={boxStats}
                initialCandidateStats={candidateStats}
            />
        </div>
    );
}
