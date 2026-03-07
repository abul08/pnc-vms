"use server";

import { createClient } from "@/utils/supabase/server";
import { userCreationSchema } from "@/lib/schemas";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function createUserAction(formData: FormData) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return { error: "Missing Supabase Service Role Key for admin actions." };
    }

    const adminAuthClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const supabase = await createClient();
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (!sessionUser) return { error: "Unauthorized" };
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", sessionUser.id).single();
    if (profile?.role !== "admin") return { error: "Forbidden" };

    const username = formData.get("username")?.toString()?.trim() || "";
    const password = formData.get("password")?.toString() || "";
    const full_name = formData.get("full_name")?.toString()?.trim() || "";
    const role = formData.get("role")?.toString() || "marker";

    const result = userCreationSchema.safeParse({ username, password, full_name, role });
    if (!result.success) {
        return { error: result.error.issues[0]?.message || "Validation failed" };
    }

    // Use admin client to create user
    const email = `${username}@vms.local`;
    const { data, error } = await adminAuthClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name,
            role,
        },
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/admin");
    return { success: true, message: "User created successfully." };
}
