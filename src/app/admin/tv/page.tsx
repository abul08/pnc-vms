import { getCandidateStatsAction, getLiveStatsAction, getBoxTurnoutStatsAction } from "@/app/actions/voter";
import CandidateTVView from "@/components/CandidateTVView";

export const dynamic = "force-dynamic";

export default async function TVAdminPage() {
    const [turnout, candidateStats, boxStats] = await Promise.all([
        getLiveStatsAction(),
        getCandidateStatsAction(),
        getBoxTurnoutStatsAction(),
    ]);

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col p-6 lg:p-10 bg-slate-950 text-slate-100"
            style={{ background: "radial-gradient(ellipse at top left, #0f172a 0%, #020617 60%, #000 100%)" }}>
            <CandidateTVView
                initialStats={candidateStats}
                initialTotal={turnout.total}
                initialVoted={turnout.voted}
                initialBoxStats={boxStats}
            />
        </div>
    );
}
