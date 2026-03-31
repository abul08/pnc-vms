import { createClient } from "@/utils/supabase/server";
import { getUser, getProfile } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";
import { getVotersByBoxGroupAction } from "@/app/actions/voter";
import ObserverVoterFilter from "@/components/ObserverVoterFilter";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CandiVotersPage() {
    const supabase = await createClient();
    const user = await getUser(supabase);
    if (!user) redirect("/login");

    const profile = await getProfile(supabase, user.id);
    if (!profile) redirect("/login");

    // Allow Admins and Candidates
    const allowedRoles = ["admin", "candi"];
    if (!allowedRoles.includes(profile.role)) {
        redirect("/");
    }

    const groupedData = await getVotersByBoxGroupAction();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-reveal">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 flex flex-col items-center justify-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-700 tracking-normal flex items-center gap-3">
                        Voters List
                    </h1>
                    <p className="text-slate-500 text-md font-normal text-center">
                        Detailed breakdown by box groups and voting status.
                    </p>
                </div>

                <Link href="/candi" className="hidden md:block">
                    <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 hover:bg-slate-50 gap-2 font-bold uppercase text-[10px] tracking-widest shadow-sm">
                        <ArrowLeft className="h-4 w-4" /> Back to stats
                    </Button>
                </Link>
            </div>

            {/* Filter View */}
            <ObserverVoterFilter groupedVoters={groupedData} />
        </div>
    );
}
