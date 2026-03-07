import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UploadExcelForm } from "@/components/AdminForms";
import VoterBoxLookup from "@/components/VoterBoxLookup";
import { Users, ListChecks, Link as LinkIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-red-600">Access Denied: Admins Only</h1>
            </div>
        );
    }

    const { count: totalVoters } = await supabase.from("voters").select("*", { count: "exact", head: true });
    const { count: votedVoters } = await supabase.from("voters").select("*", { count: "exact", head: true }).eq("vote_status", true);
    const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    const { count: totalAssignments } = await supabase.from("assignments").select("*", { count: "exact", head: true });

    const navSections = [
        {
            href: "/admin/users",
            icon: Users,
            label: "User Management",
            description: "Create, edit, and delete system users",
            stat: `${totalUsers ?? 0} users`,
            color: "bg-purple-50 text-purple-600 border-purple-100",
            badge: "bg-purple-100 text-purple-700",
        },
        {
            href: "/admin/voters",
            icon: ListChecks,
            label: "Voter List",
            description: "Full CRUD access to voter database",
            stat: `${totalVoters ?? 0} voters`,
            color: "bg-blue-50 text-blue-600 border-blue-100",
            badge: "bg-blue-100 text-blue-700",
        },
        {
            href: "/admin/assignments",
            icon: LinkIcon,
            label: "Assignments",
            description: "Assign voters to Markers and Managers",
            stat: `${totalAssignments ?? 0} assignments`,
            color: "bg-green-50 text-green-600 border-green-100",
            badge: "bg-green-100 text-green-700",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {profile.full_name ?? "Admin"}.</p>
                </div>
                <Link href="/">
                    <Button variant="outline" size="sm" className="rounded-full gap-1.5">
                        Back to Website <ArrowRight className="h-4 w-4" />
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
                    <p className="text-4xl font-bold text-slate-900">{totalVoters || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Voted</p>
                    <p className="text-4xl font-bold text-primary-600">{votedVoters || 0}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Progress</p>
                    <p className="text-4xl font-bold text-slate-900">
                        {totalVoters ? Math.round(((votedVoters || 0) / totalVoters) * 100) : 0}%
                    </p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">System Users</p>
                    <p className="text-4xl font-bold text-slate-900">{totalUsers || 0}</p>
                </div>
            </div>

            {/* Navigation to Sub-pages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {navSections.map(({ href, icon: Icon, label, description, stat, color, badge }) => (
                    <Link key={href} href={href}
                        className="group bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md hover:border-slate-200 transition-all">
                        <div className={`p-3 rounded-xl border ${color}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                            <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>{stat}</span>
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 mt-1 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                ))}
            </div>



            {/* Bulk Upload */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Bulk Upload Voters</h2>
                <p className="text-sm text-slate-400 mb-4">Upload an Excel (.xlsx) or CSV file to populate the voter database in bulk.</p>
                <UploadExcelForm />
            </section>
        </div>
    );
}
