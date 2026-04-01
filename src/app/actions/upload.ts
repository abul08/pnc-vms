"use server";

import { createClient } from "@/utils/supabase/server";
import * as xlsx from "xlsx";
import { revalidatePath } from "next/cache";

export async function uploadExcelAction(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
        return { error: "No file provided." };
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Unauthorized" };
    }

    // Load profile to verify admin role
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { error: "Forbidden: Admins only" };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = xlsx.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Parse JSON
        const data = xlsx.utils.sheet_to_json(sheet);

        // Define a helper to map possible column header variations to DB columns
        const formattedData = data.map((row: any) => {
            const getVal = (possibleKeys: string[]) => {
                const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()));
                return key ? String(row[key]) : null;
            };

            return {
                name: getVal(['name', 'full name', 'voter name', 'full_name']) || 'Unknown',
                house_name: getVal(['house', 'address', 'house name', 'house_name']),
                house_number: getVal(['house number', 'house_number', 'house no', 'house_no']),
                listq: getVal(['listq', 'list q']),
                mdp: getVal(['mdp', 'party']),
                registered_box: getVal(['box', 'registered box', 'registered_box', 'ballot box']),
                patch: getVal(['patch', 'area', 'zone']),
                national_id: getVal(['id', 'id card', 'national id', 'national_id']),
                present_location: getVal(['location', 'present location', 'present_location', 'address', 'present_address']),
                contact: getVal(['contact', 'phone', 'mobile']),
            };
        });

        // Batch insert in chunks to avoid overwhelming Postgres
        const CHUNK_SIZE = 500;
        for (let i = 0; i < formattedData.length; i += CHUNK_SIZE) {
            const chunk = formattedData.slice(i, i + CHUNK_SIZE);
            const { error: insertError } = await supabase.from("voters").insert(chunk);
            if (insertError) throw new Error(insertError.message);
        }

        // Audit Log
        await supabase.from("logs").insert({
            user_id: user.id,
            action: "BULK_UPLOAD",
            details: {
                filename: file.name,
                records_count: data.length
            },
        });

        revalidatePath("/admin");
        return { success: true, message: `Processed ${data.length} records successfully.` };
    } catch (error: any) {
        return { error: error.message };
    }
}
