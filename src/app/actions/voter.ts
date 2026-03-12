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
        const { count: total } = await adminSupabase.from("voters").select("*", { count: "exact", head: true });
        const { count: voted } = await adminSupabase.from("voters").select("*", { count: "exact", head: true }).eq("vote_status", true);
        return { total: total || 0, voted: voted || 0 };
    } catch (e) {
        console.error("Failed to fetch live stats:", e);
        return { total: 0, voted: 0 };
    }
}

