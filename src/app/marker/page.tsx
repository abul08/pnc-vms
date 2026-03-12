import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import MarkerVoterList from "@/components/MarkerVoterList";
import { ProminentLogoutButton } from "@/components/ProminentLogoutButton";

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
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-12 space-y-6">
            <div className="pt-2 px-4 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Voters</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {remaining} remaining · {votersList.length} total assigned
                    </p>
                </div>
                <ProminentLogoutButton />
            </div>

            {/* Voter List */}
            <MarkerVoterList voters={votersList} />
        </div>
    );
}
