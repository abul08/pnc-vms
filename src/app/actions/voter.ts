"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function markVoterDoneAction(voterId: string) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    // Update voter status
    const { error: updateError } = await supabase
        .from("voters")
        .update({ vote_status: true, voted_at: new Date().toISOString() })
        .eq("id", voterId);

    if (updateError) {
        return { error: updateError.message };
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Unauthorized" };

    const { error: updateError } = await supabase
        .from("voters")
        .update({ vote_status: false, voted_at: null })
        .eq("id", voterId);

    if (updateError) return { error: updateError.message };

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

