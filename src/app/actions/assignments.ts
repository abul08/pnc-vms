"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Forbidden");
    return supabase;
}

export async function assignVoterAction(formData: FormData) {
    try {
        const supabase = await assertAdmin();
        const voter_id = formData.get("voter_id")?.toString();
        const user_id = formData.get("user_id")?.toString();
        const type = formData.get("type")?.toString();
        if (!voter_id || !user_id || !type) return { error: "All fields are required" };
        if (type !== "marker" && type !== "manager") return { error: "Invalid assignment type" };
        const { error } = await supabase.from("assignments").insert({ voter_id, user_id, type });
        if (error) return { error: error.message };
        revalidatePath("/admin/assignments");
        return { success: true, message: "Voter assigned." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function unassignVoterAction(formData: FormData) {
    try {
        const supabase = await assertAdmin();
        const id = formData.get("id")?.toString();
        if (!id) return { error: "Assignment ID required" };
        const { error } = await supabase.from("assignments").delete().eq("id", id);
        if (error) return { error: error.message };
        revalidatePath("/admin/assignments");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
