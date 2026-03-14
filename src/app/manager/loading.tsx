import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerLoading() {
    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between px-4 pt-4 gap-3">
                <div className="space-y-2">
                    <Skeleton className="h-8 sm:h-10 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-slate-100">
                <div className="p-3 border-b border-slate-100 bg-slate-50/20 flex gap-2 overflow-x-auto">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-16 sm:w-20 rounded-full shrink-0" />
                    ))}
                </div>
                <div className="divide-y divide-slate-100">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-40 rounded-md" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <Skeleton className="h-4 w-24 rounded-md" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-24 rounded-full sm:w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
