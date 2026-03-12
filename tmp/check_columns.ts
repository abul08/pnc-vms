import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function updateSchema() {
    // Add patch column to voters
    console.log('Adding patch column to voters...');
    // We can't use SQL directly unless we use an RPC. 
    // But we can check if it exists by trying to select it.
    const { error: patchError } = await supabase.from('voters').select('patch').limit(1);
    if (patchError) {
        console.log('Patch column missing, please add it to voters table.');
    } else {
        console.log('Patch column exists in voters.');
    }

    // Add assigned_value to assignments
    console.log('Checking assignments table...');
    const { error: assignError } = await supabase.from('assignments').select('assigned_value').limit(1);
    if (assignError) {
        console.log('assigned_value column missing in assignments.');
    } else {
        console.log('assigned_value column exists in assignments.');
    }
}

updateSchema();
