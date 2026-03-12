import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function testPublicAccess() {
    console.log('--- Testing Public Access (Anon Key) ---');
    const { data, count, error } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error('Error fetching voters (public):', error.message);
        console.error('Error details:', error);
    } else {
        console.log('Publicly visible voter count:', count);
    }

    const { count: vc, error: ve } = await supabase
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('vote_status', true);

    if (ve) {
        console.error('Error fetching voted count (public):', ve.message);
    } else {
        console.log('Publicly visible voted count:', vc);
    }
}

testPublicAccess();
