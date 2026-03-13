import { createAdminClient } from "@/utils/supabase/admin";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCandidateStatsAction, getLiveStatsAction } from "@/app/actions/voter";
import CandidateProgress from "@/components/CandidateProgress";

export default async function CandidatesAdminPage() {
    const turnout = await getLiveStatsAction();
    const candidateStats = await getCandidateStatsAction();

    return (
        <div className="animate-reveal md:px-20 px-4 py-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 pl-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 uppercase">
                            Candidate Stats
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium">
                        Live voting progress and turnout breakdown for all election participants.
                    </p>
                </div>

                <Link href="/admin" className="hidden md:block">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 hover:bg-slate-50 gap-2 font-bold uppercase text-[10px] tracking-widest shadow-sm">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
            </div>

            <CandidateProgress
                initialStats={candidateStats}
                initialTotal={turnout.total}
                initialVoted={turnout.voted}
            />
        </div>
    );
}
