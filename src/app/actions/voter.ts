"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function markVoterDoneAction(voterId: string) {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    // Update voter status using admin client to bypass restrictive RLS
    const { data: updated, error: updateError } = await adminSupabase
        .from("voters")
        .update({ vote_status: true, voted_at: new Date().toISOString() })
        .eq("id", voterId)
        .select();

    if (updateError) {
        return { error: updateError.message };
    }

    if (!updated || updated.length === 0) {
        return { error: "Failed to update voter. You might not have permission or the voter does not exist." };
    }

    // Audit Log
    await supabase.from("logs").insert({
        user_id: user.id,
        action: "MARKED_VOTED",
        details: { voter_id: voterId },
    });

    revalidatePath("/marker");
    revalidatePath("/manager");
    revalidatePath("/");

    return { success: true };
}

export async function revertVoterAction(voterId: string) {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Unauthorized" };

    const { data: updated, error: updateError } = await adminSupabase
        .from("voters")
        .update({ vote_status: false, voted_at: null })
        .eq("id", voterId)
        .select();

    if (updateError) return { error: updateError.message };
    if (!updated || updated.length === 0) {
        return { error: "Failed to revert vote. You might not have permission or the voter does not exist." };
    }

    await supabase.from("logs").insert({
        user_id: user.id,
        action: "REVERTED_VOTE",
        details: { voter_id: voterId },
    });

    revalidatePath("/marker");
    revalidatePath("/manager");
    revalidatePath("/");
    return { success: true };
}

export async function resetAllVotingStatusAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role !== "admin") throw new Error("Forbidden");

        const { error } = await supabase.from("voters").update({ vote_status: false, voted_at: null }).neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) return { error: error.message };

        revalidatePath("/marker");
        revalidatePath("/manager");
        revalidatePath("/admin/voters");
        revalidatePath("/");
        return { success: true, message: "All voting statuses reset." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function getLiveStatsAction() {
    try {
        const adminSupabase = await createAdminClient();
        
        // Fetch from the high-speed view
        const { data, error } = await adminSupabase
            .from("dashboard_stats")
            .select("total_voters, voted_voters")
            .single();

        if (error) throw error;

        return { 
            total: data.total_voters || 0, 
            voted: data.voted_voters || 0 
        };
    } catch (e) {
        console.error("Failed to fetch live stats:", e);
        return { total: 0, voted: 0 };
    }
}

export async function getCandidateStatsAction() {
    try {
        const adminSupabase = await createAdminClient();
        
        // Execute the database function for instant summation
        const { data, error } = await adminSupabase.rpc("get_candidate_sums");

        if (error) throw error;

        return (data as Record<string, number>) || {};
    } catch (e) {
        console.error("Failed to fetch candidate stats:", e);
        return {} as Record<string, number>;
    }
}

export type BoxTurnoutStats = { label: string; total: number; voted: number; };

export async function getBoxTurnoutStatsAction(): Promise<BoxTurnoutStats[]> {
    try {
        const adminSupabase = await createAdminClient();
        let allVoters: { registered_box: string | null; vote_status: boolean | null }[] = [];
        let from = 0;
        const PAGE_SIZE = 1000;
        
        while (true) {
            const { data, error } = await adminSupabase
                .from("voters")
                .select("registered_box, vote_status")
                .range(from, from + PAGE_SIZE - 1);
            
            if (error) throw error;
            if (!data || data.length === 0) break;
            
            allVoters = [...allVoters, ...data];
            if (data.length < PAGE_SIZE) break;
            from += PAGE_SIZE;
        }

        const groups = {
            group1: { label: "70 | Sh. Milandhoo-1", total: 0, voted: 0 },
            group2: { label: "71 | Sh. Milandhoo-2", total: 0, voted: 0 },
            group3: { label: "Male', Hulhumale' & Vilimale'", total: 0, voted: 0 },
            group4: { label: "All other boxes", total: 0, voted: 0 }
        };

        const group3Boxes = [
            "437 | SH. Atoll, Male'-3",
            "529 | Hulhumale' Phase1, Ehenihen-3",
            "550 | Hulhumale' Phase2, Ehenihen-5",
            "559 | Vilimale', Ehenihen-2"
        ];

        allVoters.forEach(v => {
            const box = (v.registered_box || "").trim();
            const voted = v.vote_status ? 1 : 0;
            
            if (box === "70 | Sh. Milandhoo-1") {
                groups.group1.total++;
                groups.group1.voted += voted;
            } else if (box === "71 | Sh. Milandhoo-2") {
                groups.group2.total++;
                groups.group2.voted += voted;
            } else if (group3Boxes.includes(box)) {
                groups.group3.total++;
                groups.group3.voted += voted;
            } else {
                groups.group4.total++;
                groups.group4.voted += voted;
            }
        });

        return [groups.group1, groups.group2, groups.group3, groups.group4];
    } catch (e) {
        console.error("Failed to fetch box stats:", e);
        return [];
    }
}
