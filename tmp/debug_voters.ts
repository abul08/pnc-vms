import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugData() {
    console.log('--- Assignments ---');
    const { data: assignments } = await supabase.from('assignments').select('*');
    console.log(assignments);

    console.log('--- Voters (Samples) ---');
    const { data: voters } = await supabase.from('voters').select('name, registered_box, patch').limit(10);
    console.log(voters);

    const boxes = Array.from(new Set(voters?.map(v => v.registered_box).filter(Boolean)));
    const patches = Array.from(new Set(voters?.map(v => v.patch).filter(Boolean)));
    console.log('Unique Boxes in Sample:', boxes);
    console.log('Unique Patches in Sample:', patches);
}

debugData();
