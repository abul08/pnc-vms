import { createClient } from "@/utils/supabase/server";
import { getUser, getProfile } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";
import ManagerRealtimeList from "@/components/ManagerRealtimeList";
import VoterBoxLookup from "@/components/VoterBoxLookup";

export default async function ManagerView() {
    const supabase = await createClient();
    const user = await getUser(supabase);
    if (!user) redirect("/login");

    const [profile, { data: assignments }] = await Promise.all([
        getProfile(supabase, user.id),
        supabase.from("assignments").select("assigned_value").eq("user_id", user.id).eq("type", "manager")
    ]);
    const allowedRoles = ["admin", "manager"];
    if (!allowedRoles.includes(profile?.role)) redirect("/");

    const assignedPatches = assignments?.map(a => a.assigned_value) || [];

    const { data: voters } = await supabase
        .from("voters")
        .select("id, name, house_name, house_number, national_id, registered_box, patch, contact, vote_status, mdp, incharge")
        .in("patch", assignedPatches)
        .order("house_number", { ascending: true });

    const votersList = voters || [];
    const unvoted = votersList.filter((v: any) => v && !v.vote_status && String(v.mdp).trim() !== "10");

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
            <ManagerRealtimeList initialVoters={unvoted} />
        </div>
    );
}
