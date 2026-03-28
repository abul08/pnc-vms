import { createAdminClient } from "@/utils/supabase/admin";
export const dynamic = "force-dynamic";
import { BarChart3, Fullscreen } from "lucide-react";
import { getCandidateStatsAction, getLiveStatsAction } from "@/app/actions/voter";
import CandidateTVView from "@/components/CandidateTVView";

export default async function TVAdminPage() {
    const turnout = await getLiveStatsAction();
    const candidateStats = await getCandidateStatsAction();

    return (
        <div className="animate-reveal h-screen w-screen overflow-hidden flex flex-col p-4 lg:p-8 bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100">
            <div className="flex items-center justify-between shrink-0 mb-6 px-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-primary/20 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.3)] shadow-primary/20 backdrop-blur-md border border-primary/30">
                            <BarChart3 className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-linear-to-br from-white to-slate-400 uppercase tracking-tighter drop-shadow-2xl">
                                Election Live Feed
                            </h1>
                            <div className="flex items-center gap-3 mt-1 text-primary font-black uppercase tracking-[0.3em] text-sm">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary shadow-[0_0_10px_currentColor]"></span>
                                </span>
                                Live Display
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full overflow-hidden px-2">
                <CandidateTVView
                    initialStats={candidateStats}
                    initialTotal={turnout.total}
                    initialVoted={turnout.voted}
                />
            </div>
        </div>
    );

}
