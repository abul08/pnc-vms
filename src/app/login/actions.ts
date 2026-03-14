"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export async function loginAction(formData: FormData) {
    const username = formData.get("username")?.toString();
    const password = formData.get("password")?.toString();

    if (!username || !password) {
        return { error: "Username and password are required" };
    }

    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return { error: "Server configuration error." };
    }

    const adminAuthClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // 1. Check Rate Limit (e.g., max 5 failed attempts in the last 15 minutes per IP)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { count: failedCount, error: rateLimitError } = await adminAuthClient
        .from("login_logs")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ipAddress)
        .eq("status", "failed")
        .gte("created_at", fifteenMinutesAgo);

    if (rateLimitError) {
        console.error("Rate limit check failed:", rateLimitError);
    } else if (failedCount && failedCount >= 5) {
        return { error: "Too many login attempts. Please try again later." };
    }

    const email = `${username}@vms.local`;

    const supabase = await createClient();

    // We only care about signInWithPassword
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        // Log failed attempt
        await adminAuthClient.from("login_logs").insert({
            username,
            ip_address: ipAddress,
            user_agent: userAgent,
            status: "failed",
        });
        return { error: "Invalid login credentials." }; // Keep error generic for security
    }

    // Log successful attempt
    await adminAuthClient.from("login_logs").insert({
        username,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: "success",
    });

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
