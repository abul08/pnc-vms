"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, ListChecks, Link as LinkIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ICON_MAP = {
    users: Users,
    voters: ListChecks,
    assignments: LinkIcon,
};

interface NavCardProps {
    href: string;
    iconName: "users" | "voters" | "assignments";
    label: string;
    description: string;
    stat: string;
    color: string;
    badge: string;
}

export function AdminNavCard({ href, iconName, label, description, stat, color, badge }: NavCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const Icon = ICON_MAP[iconName] || ListChecks;

    const handleClick = (e: React.MouseEvent) => {
        if (isPending) return;
        e.preventDefault();
        startTransition(() => {
            router.push(href);
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className={cn(
                "group bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-start gap-4 hover:shadow-md hover:border-slate-200 transition-all text-left w-full relative overflow-hidden",
                isPending && "bg-slate-50/50"
            )}
        >
            {/* Shimmer overlay for pending state */}
            {isPending && (
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer" />
            )}

            <div className={cn("p-3 rounded-xl border shrink-0 transition-colors", isPending ? "bg-slate-100 border-slate-200" : color)}>
                {isPending ? (
                    <Skeleton className="w-5 h-5 rounded-md bg-slate-200" />
                ) : (
                    <Icon className="w-5 h-5" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <div className={cn("font-bold transition-colors", isPending ? "text-slate-400" : "text-slate-900 group-hover:text-primary-600")}>
                        {label}
                    </div>
                    {isPending && <Skeleton className="h-4 w-12 rounded bg-primary/10" />}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                    {isPending ? <Skeleton className="h-3 w-3/4 rounded bg-slate-100" /> : description}
                </div>
                <div className="mt-2">
                    {isPending ? (
                        <Skeleton className="h-5 w-16 rounded-full bg-slate-100" />
                    ) : (
                        <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums text-slate-900", badge)}>
                            {stat}
                        </span>
                    )}
                </div>
            </div>

            <div className="mt-1 shrink-0">
                {isPending ? (
                    <Skeleton className="w-4 h-4 rounded-full bg-slate-200" />
                ) : (
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                )}
            </div>
        </button>
    );
}

export function AdminNavCards({ sections }: { sections: NavCardProps[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.map((section) => (
                <AdminNavCard key={section.href} {...section} />
            ))}
        </div>
    );
}
