"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { voterSchema } from "@/lib/schemas";

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Forbidden");
    return supabase;
}

export async function createVoterAction(formData: FormData) {
    try {
        const supabase = await assertAdmin();
        const raw = Object.fromEntries(formData.entries());
        const result = voterSchema.safeParse(raw);

        if (!result.success) {
            return { error: result.error.issues[0]?.message || "Invalid input data" };
        }

        const { error } = await supabase.from("voters").insert(result.data);
        if (error) return { error: error.message };
        revalidatePath("/admin/voters");
        return { success: true, message: "Voter added." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateVoterAction(formData: FormData) {
    try {
        const supabase = await assertAdmin();
        const id = formData.get("id")?.toString();
        if (!id) return { error: "Voter ID required" };

        const raw = Object.fromEntries(formData.entries());
        const result = voterSchema.safeParse(raw);

        if (!result.success) {
            return { error: result.error.issues[0]?.message || "Invalid input data" };
        }

        const { error } = await supabase.from("voters").update(result.data).eq("id", id);
        if (error) return { error: error.message };
        revalidatePath("/admin/voters");
        return { success: true, message: "Voter updated." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteVoterAction(formData: FormData) {
    try {
        const supabase = await assertAdmin();
        const id = formData.get("id")?.toString();
        if (!id) return { error: "Voter ID required" };
        const { error } = await supabase.from("voters").delete().eq("id", id);
        if (error) return { error: error.message };
        revalidatePath("/admin/voters");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
