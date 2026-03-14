import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Monitor, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export default async function SecurityLogsPage() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return <div className="p-8 text-red-500 font-bold">Server configuration error: Missing environment variables.</div>;
    }

    const adminAuthClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const { data: logs, error } = await adminAuthClient
        .from("login_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

    if (error) {
        console.error("Error fetching logs:", error);
        return (
            <div className="p-8 text-red-500">
                <h2 className="text-xl font-bold">Failed to load logs</h2>
                <p>{error.message}</p>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid Date";
            
            return new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "Asia/Male"
            }).format(date);
        } catch (e) {
            return "Format Error";
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-orange-500" />
                        Security Logs
                    </h1>
                    <p className="text-slate-500 mt-1">Recent login attempts and active device tracking across the system.</p>
                </div>
                <Link href="/admin">
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-900 group">
                        Back to Dashboard <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-900">Timestamp</TableHead>
                                <TableHead className="font-semibold text-slate-900">User</TableHead>
                                <TableHead className="font-semibold text-slate-900">IP Address</TableHead>
                                <TableHead className="font-semibold text-slate-900 hidden sm:table-cell">Device User Agent</TableHead>
                                <TableHead className="font-semibold text-slate-900 text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs && logs.length > 0 ? (
                                logs.map((log) => (
                                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="whitespace-nowrap text-xs text-slate-500 font-mono">
                                            {formatDate(log.created_at)}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            {log.username}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                                {log.ip_address}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500 max-w-xs truncate hidden sm:table-cell" title={log.user_agent}>
                                            <div className="flex items-center gap-1.5">
                                                <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{log.user_agent}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {log.status === "success" ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1.5 pr-2.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Success
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1.5 pr-2.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    Failed
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                        No recent security logs found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

