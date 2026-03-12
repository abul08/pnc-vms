import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { VotersCRUD } from "@/components/admin/VotersCRUD";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const PAGE_SIZE = 500;

export default async function VotersAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/login");

    const { page: pageParam, q: search } = await searchParams;
    const page = Math.max(1, parseInt(pageParam ?? "1", 10));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
        .from("voters")
        .select("id, name, national_id, house_name, sex, consit, registered_box, contact, vote_status, patch", { count: "exact" });

    if (search) {
        query = query.or(`name.ilike.%${search}%,national_id.ilike.%${search}%`);
    }

    const { data: voters, count } = await query
        .order("name")
        .range(from, to);

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

    return (
        <div className="animate-reveal md:px-20 px-2">
            <div className="flex items-center justify-between gap-3 mb-2 py-4 px-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 pt-2">Voter List</h1>
                    <p className="text-slate-500 text-xs mt-0.5 tabular-nums">{count?.toLocaleString() ?? 0} total · Page {page} of {totalPages}</p>
                </div>
                <Link href="/admin">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700 gap-1">
                        Back <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
            <VotersCRUD
                initialVoters={voters ?? []}
                page={page}
                totalPages={totalPages}
                total={count ?? 0}
                pageSize={PAGE_SIZE}
                q={search}
            />
        </div>
    );
}
