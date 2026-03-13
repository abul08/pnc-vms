"use server";

import { createClient } from "@/utils/supabase/server";

export async function lookupVoterByIdAction(query: string) {
    if (!query?.trim()) return { error: "Please enter a name or National ID." };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const q = query.trim();

    // Try exact national ID match first
    const { data: exactMatch } = await supabase
        .from("voters")
        .select("name, national_id, registered_box")
        .eq("national_id", q)
        .single();

    if (exactMatch) return { voters: [exactMatch] };

    // Fall back to name search (partial, case-insensitive)
    const { data: nameMatches, error } = await supabase
        .from("voters")
        .select("name, national_id, registered_box")
        .ilike("name", `%${q}%`)
        .limit(10);

    if (error || !nameMatches?.length) return { error: "No voter found matching that name or National ID." };
    return { voters: nameMatches };
}
