import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ManagerRealtimeList from "@/components/ManagerRealtimeList";
import VoterBoxLookup from "@/components/VoterBoxLookup";

export default async function ManagerView() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role === "spectator") redirect("/");

    const { data: assignments } = await supabase
        .from("assignments")
        .select("assigned_value")
        .eq("user_id", user.id)
        .eq("type", "manager");

    const assignedPatches = assignments?.map(a => a.assigned_value) || [];

    const { data: voters } = await supabase
        .from("voters")
        .select("*")
        .in("patch", assignedPatches);

    const votersList = voters || [];
    const unvoted = votersList.filter((v: any) => v && !v.vote_status);

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between px-4 pt-4 gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 ">Patch Manager</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{unvoted.length} voter{unvoted.length !== 1 ? 's' : ''} remaining</p>
                </div>
            </div>
            <ManagerRealtimeList initialVoters={unvoted} />
        </div>
    );
}
