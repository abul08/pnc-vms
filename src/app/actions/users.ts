"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Forbidden");
    return supabase;
}

export async function updateUserAction(formData: FormData) {
    try {
        const supabase = await assertAdmin();
        const id = formData.get("id")?.toString();
        const full_name = formData.get("full_name")?.toString() || "";
        const role = formData.get("role")?.toString() || "marker";
        if (!id) return { error: "User ID is required" };

        const { error } = await supabase
            .from("profiles")
            .update({ full_name, role })
            .eq("id", id);

        if (error) return { error: error.message };

        revalidatePath("/admin/users");
        return { success: true, message: "User updated." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function deleteUserAction(formData: FormData) {
    try {
        await assertAdmin();
        const id = formData.get("id")?.toString();
        if (!id) return { error: "User ID is required" };
        const adminClient = getAdminClient();
        const { error } = await adminClient.auth.admin.deleteUser(id);
        if (error) return { error: error.message };
        revalidatePath("/admin/users");
        return { success: true, message: "User deleted." };
    } catch (e: any) {
        return { error: e.message };
    }
}
