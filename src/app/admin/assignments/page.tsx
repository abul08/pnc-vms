import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AssignmentManager } from "@/components/admin/AssignmentManager";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function AssignmentsAdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/login");

    const { data: voters } = await supabase
        .from("voters")
        .select("registered_box, patch");

    const boxes = Array.from(new Set(voters?.map(v => v.registered_box).filter(Boolean))) as string[];
    const patches = Array.from(new Set(voters?.map(v => v.patch).filter(Boolean))) as string[];

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
