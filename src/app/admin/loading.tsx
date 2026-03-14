import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-5 w-48 rounded-md" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-12 w-32 rounded-xl" />
                    <Skeleton className="h-12 w-48 rounded-xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                        <Skeleton className="h-4 w-24 rounded-md" />
                        <Skeleton className="h-10 w-16 rounded-lg" />
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded-md" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-2xl border p-6 space-y-4 bg-white">
                            <div className="flex justify-between items-start">
                                <Skeleton className="h-12 w-12 rounded-xl" />
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-32 rounded-md" />
                                <Skeleton className="h-4 w-full rounded-md" />
                            </div>
                            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                                <Skeleton className="h-8 w-24 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
