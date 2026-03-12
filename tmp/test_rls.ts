import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

// Use ANON KEY instead of SERVICE ROLE KEY to test RLS
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function testRLS() {
    // We need to simulate being logged in. This is hard without a valid session.
    // However, we can check if the policies on the 'voters' table allow any access.
    
    console.log('--- Testing RLS with Anon Key ---');
    const { data, error } = await supabase.from('voters').select('name').limit(1);
    if (error) {
        console.log('Error (likely RLS blocking):', error.message);
    } else {
        console.log('Data (RLS maybe open):', data);
    }
}

testRLS();
