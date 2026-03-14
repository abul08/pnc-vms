import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UploadExcelForm } from "@/components/AdminForms";
import VoterBoxLookup from "@/components/VoterBoxLookup";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminNavCards } from "@/components/admin/AdminNavCards";
import { ProminentLogoutButton } from "@/components/ProminentLogoutButton";

export default async function AdminDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // We still need the profile for the welcome message
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

    const { count: totalVoters } = await supabase.from("voters").select("*", { count: "exact", head: true });
    const { count: votedVoters } = await supabase.from("voters").select("*", { count: "exact", head: true }).eq("vote_status", true);
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: totalAssignments } = await supabase.from("assignments").select("*", { count: "exact", head: true });
    const { count: totalLogs } = await supabase.from("login_logs").select("*", { count: "exact", head: true });

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
