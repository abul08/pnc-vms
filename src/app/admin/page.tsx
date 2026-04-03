import { createClient } from "@/utils/supabase/server";
import { getUser, getProfile } from "@/utils/supabase/queries";
import { redirect } from "next/navigation";
import { UploadExcelForm } from "@/components/AdminForms";
import VoterBoxLookup from "@/components/VoterBoxLookup";
import { ArrowRight, Tv } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNavCards } from "@/components/admin/AdminNavCards";
import { ProminentLogoutButton } from "@/components/ProminentLogoutButton";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export default async function AdminDashboard() {
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let adminAuthClient = supabase; // Fallback
    if (supabaseUrl && serviceRoleKey) {
        adminAuthClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }

    // Start fetching stats concurrently
    const statsPromise = adminAuthClient
        .from("dashboard_stats")
        .select("*")
        .single();

    const user = await getUser(supabase);

    // We still need the profile for the welcome message
    const profile = await getProfile(supabase, user?.id);

    // Await the stats after user profile is fetched
    const { data: stats, error: statsError } = await statsPromise;

    if (statsError) {
        console.error("Error fetching dashboard stats:", statsError);
    }

    const {
        total_voters: totalVoters,
        voted_voters: votedVoters,
        total_users: totalUsers,
        total_assignments: totalAssignments,
        total_logs: totalLogs
    } = stats || {};

    // Passing iconName as string to satisfy serializability requirements
    const navSections = [
        {
            href: "/admin/users",
            iconName: "users" as const,
            label: "User Management",
            description: "Create, edit, and delete system users",
            stat: `${totalUsers ?? 0} users`,
            color: "bg-purple-50 text-purple-600 border-purple-100",
            badge: "bg-purple-100 text-purple-700",
        },
        {
            href: "/admin/voters",
            iconName: "voters" as const,
            label: "Voter List",
            description: "Full CRUD access to voter database",
            stat: `${totalVoters ?? 0} voters`,
            color: "bg-blue-50 text-blue-600 border-blue-100",
            badge: "bg-blue-100 text-blue-700",
        },
        {
            href: "/admin/assignments",
            iconName: "assignments" as const,
            label: "Assignments",
            description: "Assign voters to Markers and Managers",
            stat: `${totalAssignments ?? 0} assignments`,
            color: "bg-green-50 text-green-600 border-green-100",
            badge: "bg-green-100 text-green-700",
        },
        {
            href: "/admin/logs",
            iconName: "logs" as const,
            label: "Security Logs",
            description: "View login attempts & device tracking",
            stat: `${totalLogs ?? 0} records`,
            color: "bg-orange-50 text-orange-600 border-orange-100",
            badge: "bg-orange-100 text-orange-700",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-reveal">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {profile?.full_name ?? "Admin"}.</p>
                </div>
                <Link href="/admin/tv" target="_blank">
                    <Button variant="outline" className="gap-2 h-10 px-5 rounded-xl border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-primary/5 font-semibold text-sm shadow-sm">
                        <Tv className="w-4 h-4" />
                        TV Display
                    </Button>
                </Link>
            </div>

            {/* Box Lookup */}
            <div>
                <VoterBoxLookup label="Check Registered Box" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Registered</p>
                    <p className="text-4xl font-bold text-slate-900 tabular-nums">{totalVoters || 0}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">System Users</p>
                    <p className="text-4xl font-bold text-slate-900 tabular-nums">{totalUsers || 0}</p>
                </div>
            </div>

            {/* Navigation to Sub-pages with Inline Loading */}
            <AdminNavCards sections={navSections} />

            {/* Bulk Upload */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Bulk Upload Voters</h2>
                <p className="text-sm text-slate-400 mb-4">Upload an Excel (.xlsx) or CSV file to populate the voter database in bulk.</p>
                <UploadExcelForm />
            </section>
        </div>
    );
}
