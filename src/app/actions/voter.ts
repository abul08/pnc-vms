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
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { total: 0, voted: 0 };

        const adminSupabase = await createAdminClient();
        const { count: total } = await adminSupabase.from("voters").select("*", { count: "exact", head: true });
        const { count: voted } = await adminSupabase.from("voters").select("*", { count: "exact", head: true }).eq("vote_status", true);
        return { total: total || 0, voted: voted || 0 };
    } catch (e) {
        console.error("Failed to fetch live stats:", e);
        return { total: 0, voted: 0 };
    }
}

export async function getCandidateStatsAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return {} as Record<string, number>;

        const adminSupabase = await createAdminClient();
        
        // We want to sum all the numeric columns for voters where vote_status = true
        // One way is to fetch everything and sum in JS, but better to sum in DB
        // However, Supabase select() doesn't easily do many sums in one go without raw RPC
        // Since it's only 21 columns and voters count is small (estimated for local election), fetching sums via select could work
        
        // For simplicity and speed, let's fetch only the numeric columns where voted = true
        const { data, error } = await adminSupabase
            .from("voters")
            .select("nihadh,athif,nasheedha,nasrath,haniyya,zahiyya,sarumeela,saeed,saif,shiyam,alim,yumna,fareesha,najeeba,lamya,samrath,nuha,faathun,samaa,rasheedha,raashidha")
            .eq("vote_status", true);

        if (error) throw error;

        const stats: Record<string, number> = {};
        const columns = [
            "nihadh", "athif", "nasheedha", "nasrath", "haniyya", "zahiyya", "sarumeela",
            "saeed", "saif", "shiyam", "alim", "yumna", "fareesha", "najeeba", "lamya",
            "samrath", "nuha", "faathun", "samaa", "rasheedha", "raashidha"
        ];

        columns.forEach(col => stats[col] = 0);

        data?.forEach(row => {
            columns.forEach(col => {
                stats[col] += (row as any)[col] || 0;
            });
        });

        return stats;
    } catch (e) {
        console.error("Failed to fetch candidate stats:", e);
        return {} as Record<string, number>;
    }
}
