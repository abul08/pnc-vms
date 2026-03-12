import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function debugData() {
    console.log('--- Profiles ---');
    const { data: profiles } = await supabase.from('profiles').select('*');
    console.log(profiles);

    console.log('--- Assignments ---');
    const { data: assignments } = await supabase.from('assignments').select('*');
    console.log(assignments);

    // Get a sample user's ID (e.g. the first marker)
    const markerProfile = profiles?.find(p => p.role === 'marker');
    if (markerProfile) {
        console.log(`--- Checking for Marker: ${markerProfile.full_name} (${markerProfile.id}) ---`);
        const { data: markerAssignments } = await supabase
            .from("assignments")
            .select("assigned_value")
            .eq("user_id", markerProfile.id)
            .eq("type", "marker");
        console.log('Marker Assignments:', markerAssignments);
        
        const boxes = markerAssignments?.map(a => a.assigned_value) || [];
        const { data: voters } = await supabase
            .from("voters")
            .select("name, registered_box")
            .in("registered_box", boxes);
        console.log('Voters match count:', voters?.length);
        console.log('Voters sample:', voters?.slice(0, 3));
    }
}

debugData();
