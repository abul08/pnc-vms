"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
    const username = formData.get("username")?.toString();
    const password = formData.get("password")?.toString();

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    const email = `${username}@vms.local`;

    const supabase = await createClient();

    // We only care about signInWithPassword
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // Fetch role and redirect to appropriate view
    const supabaseForProfile = await createClient();
    const { data: { user: loggedInUser } } = await supabaseForProfile.auth.getUser();
    const { data: profile } = await supabaseForProfile
        .from("profiles")
        .select("role")
        .eq("id", loggedInUser!.id)
        .single();

    const role = profile?.role ?? "marker";
    if (role === "admin") redirect("/admin");
    if (role === "manager") redirect("/manager");
    redirect("/marker");
}
