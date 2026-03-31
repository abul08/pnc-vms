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

export async function assignAreaAction(formData: FormData) {
    try {
        const supabase = await assertAdmin();
        const assigned_values = formData.getAll("assigned_values").map(v => v.toString());
        const user_id = formData.get("user_id")?.toString();
        const type = formData.get("type")?.toString();
        
        if (assigned_values.length === 0 || !user_id || !type) return { error: "Selection required" };
        if (type !== "marker" && type !== "manager") return { error: "Invalid assignment type" };

        // Check for existing assignment for these areas/type
        const { data: existing } = await supabase
            .from("assignments")
            .select("assigned_value")
            .eq("type", type)
            .in("assigned_value", assigned_values);

        if (existing && existing.length > 0) {
            const list = existing.map(e => e.assigned_value).join(", ");
            return { error: `Already assigned: ${list}` };
        }

        const inserts = assigned_values.map(val => ({
            assigned_value: val,
            user_id,
            type
        }));

        const { error } = await supabase.from("assignments").insert(inserts);
        if (error) return { error: error.message };
        
        revalidatePath("/admin/assignments");
        return { success: true, message: `Assigned ${assigned_values.length} items.` };
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

export async function resetAllAssignmentsAction() {
    try {
        const supabase = await assertAdmin();
        const { error } = await supabase.from("assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) return { error: error.message };

        revalidatePath("/admin/assignments");
        return { success: true, message: "All assignments cleared." };
    } catch (e: any) {
        return { error: e.message };
    }
}
