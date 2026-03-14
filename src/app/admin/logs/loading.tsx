import { Skeleton } from "@/components/ui/skeleton";

export default function LogsLoading() {
    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            <div className="pt-2 px-4 flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <Skeleton className="h-5 w-64 rounded-md" />
                </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-slate-100">
                <div className="p-4 border-b border-slate-100 bg-slate-50/20">
                    <Skeleton className="h-11 w-full rounded-xl" />
                </div>
                <div className="divide-y divide-slate-100">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-32 rounded-md" />
                                <Skeleton className="h-4 w-64 rounded-md" />
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <Skeleton className="h-10 sm:h-12 w-1/2 sm:w-24 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
