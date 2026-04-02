"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { markVoterDoneAction, revertVoterAction } from "@/app/actions/voter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, RotateCcw, Search, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const BROADCAST_CHANNEL = "vms-votes";

function VoterCard({ voter, onVoteChange }: { voter: any, onVoteChange?: (id: string, voted: boolean) => void }) {
    const [isPending, startTransition] = useTransition();
    const [optimisticVoted, setOptimisticVoted] = useState<boolean>(voter.vote_status);
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        setOptimisticVoted(voter.vote_status);
    }, [voter.vote_status]);

    function broadcast(vote_status: boolean) {
        supabase.channel(BROADCAST_CHANNEL).send({
            type: "broadcast",
            event: "vote-update",
            payload: { ...voter, vote_status },
        });
    }

    async function handleMark() {
        setOptimisticVoted(true);
        startTransition(async () => {
            const res = await markVoterDoneAction(voter.id);
            if (res?.error) {
                setOptimisticVoted(false);
                alert(`Error marking voter: ${res.error}`);
            } else {
                broadcast(true);
                onVoteChange?.(voter.id, true);
            }
        });
    }

    async function handleRevert() {
        setOptimisticVoted(false);
        startTransition(async () => {
            const res = await revertVoterAction(voter.id);
            if (res?.error) {
                setOptimisticVoted(true);
                alert(`Error reverting vote: ${res.error}`);
            } else {
                broadcast(false);
                onVoteChange?.(voter.id, false);
            }
        });
    }

    if (optimisticVoted) {
        return (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-muted/50 opacity-75">
                <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{voter.name}</p>
                    {(voter.house_name || voter.present_address) && (
                        <p className="text-xs text-muted-foreground truncate">{voter.house_name || voter.present_address}</p>
                    )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100">
                        <CheckCircle2 className="w-3 h-3" /> Voted
                    </Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-orange-500"
                        disabled={isPending}
                        onClick={handleRevert}
                        title="Revert vote"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-card shadow-sm">
            <div className="min-w-0">
                <p className="font-semibold truncate">{voter.name}</p>
                <div className="flex flex-col gap-2 mt-0.5">
                    {(voter.house_name || voter.present_address) && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{voter.house_name || voter.present_address}</p>
                    )}
                    <div className="flex items-center gap-2">
                        {voter.registered_box && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 font-semibold tabular-nums border-primary/20 text-primary">
                                Box {voter.registered_box}
                            </Badge>
                        )}
                        {voter.listq && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1 font-semibold tabular-nums border-slate-200 text-slate-500">
                                List Q. {voter.listq}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
            <Button
                size="icon"
                className="shrink-0 h-10 w-10 shadow-lg shadow-primary/10"
                disabled={isPending}
                onClick={handleMark}
                title="Mark as voted"
            >
                <CheckCircle2 className="w-5 h-5" />
            </Button>
        </div>
    );
}

export default function MarkerVoterList({ voters: initialAssigned }: { voters: any[] }) {
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<"all" | "pending" | "voted">("all");

    const filteredAssigned = useMemo(() => {
        const q = search.trim();
        if (!q) return initialAssigned;

        // If the query is purely numeric, only match exact listq
        if (/^\d+$/.test(q)) {
            return initialAssigned.filter(v =>
                v.listq?.toString() === q
            );
        }

        // Otherwise, do a general text search across name/address fields
        const ql = q.toLowerCase();
        return initialAssigned.filter(v =>
            v.name?.toLowerCase().includes(ql) ||
            v.house_name?.toLowerCase().includes(ql) ||
            v.present_address?.toLowerCase().includes(ql) ||
            v.national_id?.toLowerCase().includes(ql)
        );
    }, [initialAssigned, search]);

    const handleSearch = (val: string) => {
        setSearch(val);
    };

    const displayList = filteredAssigned;
    const pending = displayList.filter(v => !v.vote_status);
    const voted = displayList.filter(v => v.vote_status);

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row items-center gap-3">
                <div className="relative w-full xl:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="search"
                        placeholder="Search assigned voters..."
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="pl-9 pr-9 h-12 rounded-xl border-slate-200 focus:border-primary shadow-sm"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => handleSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <div className="flex items-center p-1 bg-slate-100 rounded-xl w-full xl:w-auto h-12 overflow-x-auto ring-1 ring-slate-200/50">
                    <button
                        onClick={() => setFilterType("all")}
                        className={`flex-1 xl:flex-none px-6 h-full text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filterType === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterType("pending")}
                        className={`flex-1 xl:flex-none px-6 h-full text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filterType === "pending" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => setFilterType("voted")}
                        className={`flex-1 xl:flex-none px-6 h-full text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${filterType === "voted" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                    >
                        Marked Voted
                    </button>
                </div>
            </div>

            {(filterType === "all" || filterType === "pending") && (
                <>
                    {filterType === "pending" && (
                        <p className="text-[16px] font-semibold text-muted-foreground uppercase tracking-normal px-1">
                            Pending Voters · {pending.length}
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pending.map(v => <VoterCard key={v.id} voter={v} />)}
                    </div>

                    {pending.length === 0 && (
                        <div className="text-center py-16 rounded-3xl border border-dashed bg-muted/20">
                            <CheckCircle2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                            {search ? (
                                <>
                                    <p className="font-bold text-slate-800">No matches found</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Check the spelling or ID and try again.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-slate-800">All Assigned Done!</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Great job! All assigned voters in your box have voted.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {(filterType === "all" || filterType === "voted") && (
                <>
                    {voted.length > 0 ? (
                        <div className={`space-y-3 ${filterType === "all" ? "pt-4 border-t border-dashed" : ""}`}>
                            <p className="text-[16px] font-semibold text-muted-foreground uppercase tracking-normal px-1">
                                Already Marked · {voted.length}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
                                {voted.map(v => <VoterCard key={v.id} voter={v} />)}
                            </div>
                        </div>
                    ) : (
                        filterType === "voted" && search === "" && (
                            <div className="text-center py-16 rounded-3xl border border-dashed bg-muted/20">
                                <p className="font-bold text-slate-800">No Votes Marked Yet</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Voters that have been marked will appear here.
                                </p>
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
}
