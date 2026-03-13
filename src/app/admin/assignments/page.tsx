import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AssignmentManager } from "@/components/admin/AssignmentManager";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function AssignmentsAdminPage() {
    const supabase = await createClient();
    
    // Exhaustive fetch for unique boxes and patches
    let allVoters: { registered_box: string | null; patch: string | null }[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    
    while (true) {
        const { data } = await supabase
            .from("voters")
            .select("registered_box, patch")
            .range(from, from + PAGE_SIZE - 1);
        
        if (!data || data.length === 0) break;
        allVoters = [...allVoters, ...data];
        if (data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
    }

    const boxes = Array.from(new Set(allVoters.map(v => v.registered_box).filter(Boolean))) as string[];
    const patches = Array.from(new Set(allVoters.map(v => v.patch).filter(Boolean))) as string[];
    
    boxes.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    patches.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .in("role", ["marker", "manager"])
        .order("full_name");

    const { data: assignments } = await supabase
        .from("assignments")
        .select("id, type, user_id, assigned_value, profiles(full_name, role)")
        .order("created_at", { ascending: false });

    return (
        <div className="animate-reveal">
            <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 pt-4 mb-4">
                    <h1 className="text-xl font-bold text-slate-900">Voter Assignments</h1>
                    <Link href="/admin">
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 gap-1">
                            Back <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                <AssignmentManager
                    boxes={boxes}
                    patches={patches}
                    users={users ?? []}
                    assignments={(assignments ?? []) as any[]}
                />
            </div>
        </div>
    );
}
