import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MarkerVoterList from "@/components/MarkerVoterList";
import VoterBoxLookup from "@/components/VoterBoxLookup";

export default async function MarkerView() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: assignments } = await supabase
        .from("assignments")
        .select("assigned_value")
        .eq("user_id", user.id)
        .eq("type", "marker");

    const assignedBoxes = assignments?.map(a => a.assigned_value) || [];
    
    const { data: voters } = await supabase
        .from("voters")
        .select("*")
        .in("registered_box", assignedBoxes);

    const votersList = voters || [];
    const remaining = votersList.filter((v: any) => !v.vote_status).length;

    return (
        <div className="max-w-md mx-auto p-4 pb-12 space-y-4">
            <div className="pt-2">
                <h1 className="text-2xl font-bold text-slate-900">Voters</h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    {remaining} remaining · {voters.length} total assigned
                </p>
            </div>

            {/* Box Lookup */}
            <VoterBoxLookup />

            <MarkerVoterList voters={votersList} />
        </div>
    );
}
