"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCandidateStatsAction, getLiveStatsAction, getBoxTurnoutStatsAction, type BoxTurnoutStats } from "@/app/actions/voter";
import { ELECTION_CONFIG } from "@/lib/candidate-config";

const BROADCAST_CHANNEL = "vms-votes";

function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(value);
    useEffect(() => {
        setDisplay(value);
    }, [value]);
    return <span>{display.toLocaleString()}</span>;
}

export default function CandidateTVView({
    initialStats,
    initialTotal,
    initialVoted,
    initialBoxStats,
}: {
    initialStats: Record<string, number>;
    initialTotal: number;
    initialVoted: number;
    initialBoxStats: BoxTurnoutStats[];
}) {
    const [stats, setStats] = useState(initialStats);
    const [totalCount, setTotalCount] = useState(initialTotal);
    const [votedCount, setVotedCount] = useState(initialVoted);
    const [boxStats, setBoxStats] = useState(initialBoxStats);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        const fetchAllData = async () => {
            const [newStats, turnout, newBoxStats] = await Promise.all([
                getCandidateStatsAction(),
                getLiveStatsAction(),
                getBoxTurnoutStatsAction(),
            ]);
            setStats(newStats);
            setTotalCount(turnout.total);
            setVotedCount(turnout.voted);
            setBoxStats(newBoxStats);
        };
        const channel = supabase
            .channel(BROADCAST_CHANNEL)
            .on("broadcast", { event: "vote-update" }, fetchAllData)
            .on("broadcast", { event: "stats-update" }, fetchAllData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    const turnoutPct = totalCount > 0 ? Math.round((votedCount / totalCount) * 100) : 0;

    return (
        <div className="flex flex-col h-full gap-5 w-full min-h-0 select-none">

            {/* ── Overall Turnout Banner ── */}
            <div className="shrink-0 flex items-center gap-8 px-8 py-5 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-white/10">
                {/* Live pulse */}
                <div className="flex items-center gap-3 shrink-0">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Live</span>
                </div>

                {/* Numbers */}
                <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-black tabular-nums text-white tracking-tight">
                        <AnimatedNumber value={votedCount} />
                    </span>
                    <span className="text-slate-600 font-bold text-xl">/</span>
                    <span className="text-2xl font-bold tabular-nums text-slate-400">
                        <AnimatedNumber value={totalCount} />
                    </span>
                </div>

                {/* Progress bar */}
                <div className="flex-1 relative h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${turnoutPct}%` }}
                    />
                </div>

                {/* Percentage */}
                <span className="text-4xl font-black text-emerald-400 tabular-nums shrink-0">{turnoutPct}<span className="text-2xl opacity-60">%</span></span>
            </div>

            {/* ── Box Stats Row ── */}
            <div className="shrink-0 grid gap-4" style={{ gridTemplateColumns: `repeat(${boxStats.length}, minmax(0,1fr))` }}>
                {boxStats.map((box) => {
                    const pct = box.total > 0 ? Math.round((box.voted / box.total) * 100) : 0;
                    return (
                        <div
                            key={box.label}
                            className="relative rounded-2xl overflow-hidden border border-white/8 bg-slate-900/80"
                            style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.01) 100%)" }}
                        >
                            {/* fill bar as background */}
                            <div
                                className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                            />
                            <div className="relative px-5 py-4 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate mb-1">{box.label}</p>
                                    <p className="text-lg font-black tabular-nums text-white">
                                        <AnimatedNumber value={box.voted} />
                                        <span className="text-slate-600 font-semibold text-sm ml-1">/ {box.total.toLocaleString()}</span>
                                    </p>
                                </div>
                                <span className="text-3xl font-black text-primary tabular-nums shrink-0">{pct}<span className="text-lg opacity-60">%</span></span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Candidate Columns ── */}
            <div className="flex-1 min-h-0 flex gap-5">
                {ELECTION_CONFIG.map((group) => (
                    <div key={group.title} className="flex flex-col gap-3 min-w-0" style={{ flex: group.categories.length }}>
                        {/* Group label */}
                        <div className="shrink-0 px-1 flex items-center gap-3">
                            <div className="w-1 h-4 rounded-full bg-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">{group.title}</p>
                        </div>

                        <div
                            className="flex-1 min-h-0 grid gap-4"
                            style={{ gridTemplateColumns: `repeat(${group.categories.length}, minmax(0,1fr))` }}
                        >
                            {group.categories.map((category) => (
                                <div
                                    key={category.title}
                                    className="flex flex-col rounded-2xl overflow-hidden border border-white/8"
                                    style={{ background: "linear-gradient(160deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)" }}
                                >
                                    {/* Header */}
                                    <div className="shrink-0 px-6 py-3 border-b border-white/8">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{category.title}</p>
                                    </div>

                                    {/* Candidates */}
                                    <div className="flex-1 flex flex-col divide-y divide-white/5">
                                        {category.candidates.map((candidate) => {
                                            const votes = stats[candidate.id] || 0;
                                            const pct = votedCount > 0 ? Math.round((votes / votedCount) * 100) : 0;

                                            return (
                                                <div key={candidate.id} className="flex-1 flex flex-col justify-center px-6 py-3 relative group overflow-hidden">
                                                    {/* background fill */}
                                                    <div
                                                        className="absolute inset-y-0 left-0 bg-primary/8 transition-all duration-1000"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                    <div className="relative flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="shrink-0 w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs xl:text-sm font-black text-slate-400">
                                                                {candidate.number}
                                                            </span>
                                                            <p className="font-bold text-white text-sm xl:text-base truncate">{candidate.name}</p>
                                                        </div>
                                                        <div className="flex items-baseline gap-2 shrink-0">
                                                            <span className="text-2xl xl:text-3xl font-black tabular-nums text-white tracking-tight">
                                                                <AnimatedNumber value={votes} />
                                                            </span>
                                                            <span className="text-xs xl:text-sm font-black text-primary">{pct}%</span>
                                                        </div>
                                                    </div>
                                                    {/* thin progress line at bottom */}
                                                    <div className="relative mt-2 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-1000"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
