import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkVotersSchema() {
    console.log('--- Checking Voters Table Schema ---');
    const { data, error } = await supabase.from('voters').select('*').limit(1);
    if (error) {
        console.error('Error fetching voters:', error);
    } else {
        console.log('Voter columns:', Object.keys(data[0] || {}));
        console.log('Voter sample data:', data[0]);
    }

    console.log('\n--- Checking RLS Policies (Raw) ---');
    const { data: policies, error: polError } = await supabase.rpc('get_policies', { table_name: 'voters' });
    // Note: get_policies is not a default RPC, usually need to query pg_policies
    const { data: pgPolicies, error: pgError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'voters');
        
    if (pgError) {
        // Fallback to plain query if pg_policies is not exposed (often it isn't via RPC/REST)
        console.log('Could not query pg_policies directly via REST.');
    } else {
        console.log('Policies:', pgPolicies);
    }
}

checkVotersSchema();
