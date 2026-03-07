import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UsersCRUD } from "@/components/admin/UsersCRUD";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default async function UsersAdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/login");

    const { data: users } = await supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false });

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h1 className="text-xl font-bold text-slate-900">User Management</h1>
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 gap-1">
                        Back <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
            <UsersCRUD initialUsers={users ?? []} />
        </div>
    );
}
