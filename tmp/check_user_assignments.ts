import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TARGET_USER_ID = '9b4f874e-0276-4b4e-9368-f917e7fe2ec6';

async function checkUserAssignments() {
    console.log(`--- Checking for User ID: ${TARGET_USER_ID} ---`);
    const { data: assignments } = await supabase
        .from("assignments")
        .select("*")
        .eq("user_id", TARGET_USER_ID);
    console.log('Assignments:', assignments);
}

checkUserAssignments();
