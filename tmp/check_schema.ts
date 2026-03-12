import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSchema() {
    const { data, error } = await supabase.from('assignments').select('*').limit(1);
    console.log('Assignments data sample:', data);
    if (error) console.error('Error fetching assignments:', error);
}

checkSchema();
