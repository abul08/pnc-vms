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

        const group3Boxes = [
            "437 | SH. Atoll, Male'-3",
            "529 | Hulhumale' Phase1, Ehenihen-3",
            "550 | Hulhumale' Phase2, Ehenihen-5",
            "559 | Vilimale', Ehenihen-2"
        ];

        // Fire 4 lightweight COUNT queries in parallel instead of fetching all rows
        const [r1total, r1voted, r2total, r2voted, r3total, r3voted, rAll] = await Promise.all([
            adminSupabase.from("voters").select("id", { count: "exact", head: true }).eq("registered_box", "70 | Sh. Milandhoo-1"),
            adminSupabase.from("voters").select("id", { count: "exact", head: true }).eq("registered_box", "70 | Sh. Milandhoo-1").eq("vote_status", true),
            adminSupabase.from("voters").select("id", { count: "exact", head: true }).eq("registered_box", "71 | Sh. Milandhoo-2"),
            adminSupabase.from("voters").select("id", { count: "exact", head: true }).eq("registered_box", "71 | Sh. Milandhoo-2").eq("vote_status", true),
            adminSupabase.from("voters").select("id", { count: "exact", head: true }).in("registered_box", group3Boxes),
            adminSupabase.from("voters").select("id", { count: "exact", head: true }).in("registered_box", group3Boxes).eq("vote_status", true),
            adminSupabase.from("dashboard_stats").select("total_voters, voted_voters").single(),
        ]);

        const g1total = r1total.count ?? 0;
        const g1voted = r1voted.count ?? 0;
        const g2total = r2total.count ?? 0;
        const g2voted = r2voted.count ?? 0;
        const g3total = r3total.count ?? 0;
        const g3voted = r3voted.count ?? 0;
        const allTotal = rAll.data?.total_voters ?? 0;
        const allVoted = rAll.data?.voted_voters ?? 0;

        return [
            { label: "70 | Sh. Milandhoo-1",            total: g1total, voted: g1voted },
            { label: "71 | Sh. Milandhoo-2",            total: g2total, voted: g2voted },
            { label: "Male', Hulhumale' & Vilimale'",    total: g3total, voted: g3voted },
            { label: "All other boxes",                  total: Math.max(0, allTotal - g1total - g2total - g3total), voted: Math.max(0, allVoted - g1voted - g2voted - g3voted) },
        ];
    } catch (e) {
        console.error("Failed to fetch box stats:", e);
        return [];
    }
}

export async function getVotersByBoxGroupAction() {
    try {
        const adminSupabase = await createAdminClient();

        const group3Boxes = [
            "437 | SH. Atoll, Male'-3",
            "529 | Hulhumale' Phase1, Ehenihen-3",
            "550 | Hulhumale' Phase2, Ehenihen-5",
            "559 | Vilimale', Ehenihen-2"
        ];

        // Fetch each group in parallel — single query each, avoids sequential while-loop RTTs
        const COLS = "id, name, house_name, present_address, national_id, registered_box, vote_status, voted_at";
        const [res1, res2, res3, res4] = await Promise.all([
            adminSupabase.from("voters").select(COLS).eq("registered_box", "70 | Sh. Milandhoo-1").limit(2000),
            adminSupabase.from("voters").select(COLS).eq("registered_box", "71 | Sh. Milandhoo-2").limit(2000),
            adminSupabase.from("voters").select(COLS).in("registered_box", group3Boxes).limit(2000),
            adminSupabase.from("voters").select(COLS).not("registered_box", "in", `(${["70 | Sh. Milandhoo-1", "71 | Sh. Milandhoo-2", ...group3Boxes].map(b => `"${b}"`).join(",")})`).limit(5000),
        ]);

        return {
            group1: res1.data ?? [],
            group2: res2.data ?? [],
            group3: res3.data ?? [],
            group4: res4.data ?? [],
        };
    } catch (e) {
        console.error("Failed to fetch grouped voters:", e);
        return { group1: [], group2: [], group3: [], group4: [] };
    }
}
