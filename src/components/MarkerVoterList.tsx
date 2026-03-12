"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import { markVoterDoneAction, revertVoterAction } from "@/app/actions/voter";
import { lookupVoterByIdAction } from "@/app/actions/lookup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, RotateCcw, Search, Globe, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const BROADCAST_CHANNEL = "vms-votes";

function VoterCard({ voter, onVoteChange }: { voter: any, onVoteChange?: (id: string, voted: boolean) => void }) {
    const [isPending, startTransition] = useTransition();
    const [optimisticVoted, setOptimisticVoted] = useState<boolean>(voter.vote_status);
    const supabase = useRef(createClient()).current;

    // Sync state if voter prop changes (relevant for global results being marked)
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

    function handleMark() {
        setOptimisticVoted(true);
        startTransition(async () => {
            await markVoterDoneAction(voter.id);
            broadcast(true);
            onVoteChange?.(voter.id, true);
        });
    }

    function handleRevert() {
        setOptimisticVoted(false);
        startTransition(async () => {
            await revertVoterAction(voter.id);
            broadcast(false);
            onVoteChange?.(voter.id, false);
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
                <div className="flex items-center gap-2 mt-0.5">
                    {(voter.house_name || voter.present_address) && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{voter.house_name || voter.present_address}</p>
                    )}
                    {voter.registered_box && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 font-semibold tabular-nums border-primary/20 text-primary">
                            Box {voter.registered_box}
                        </Badge>
                    )}
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
    const [globalMode, setGlobalMode] = useState(false);
    const [globalResults, setGlobalResults] = useState<any[]>([]);
    const [isSearching, startSearch] = useTransition();

    const filteredAssigned = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return initialAssigned;
        return initialAssigned.filter(v =>
            v.name?.toLowerCase().includes(q) ||
            v.house_name?.toLowerCase().includes(q) ||
            v.present_address?.toLowerCase().includes(q) ||
            v.national_id?.includes(q)
        );
    }, [initialAssigned, search]);

    const handleSearch = (val: string) => {
        setSearch(val);
        if (globalMode && val.trim().length >= 2) {
            startSearch(async () => {
                const res = await lookupVoterByIdAction(val);
                setGlobalResults(res.voters ?? []);
            });
        }
    };

    const toggleGlobal = () => {
        const next = !globalMode;
        setGlobalMode(next);
        if (next && search.trim().length >= 2) {
            handleSearch(search);
        } else {
            setGlobalResults([]);
        }
    };

    const displayList = globalMode ? globalResults : filteredAssigned;
    const pending = displayList.filter(v => !v.vote_status);
    const voted = displayList.filter(v => v.vote_status);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground animate-spin" />
                    )}
                    <Input
                        type="search"
                        placeholder={globalMode ? "Search global list..." : "Search assigned..."}
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="pl-9 pr-9 h-11 rounded-xl shadow-xs"
                    />
                </div>
                <Button
                    variant={globalMode ? "default" : "outline"}
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-xl"
                    onClick={toggleGlobal}
                    title={globalMode ? "Switch to My Voters" : "Search Global Voter List"}
                >
                    <Globe className="w-5 h-5" />
                </Button>
            </div>
            {globalMode && (
                <div className="flex items-center gap-2 px-1 py-1">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter bg-blue-100 text-blue-700">
                        Global Mode
                    </Badge>
                    <p className="text-[10px] text-muted-foreground font-medium">Showing matches from all constituencies</p>
                </div>
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
                                {globalMode ? "Check the ID and try again." : "Try switching to Global Search."}
                            </p>
                            {!globalMode && (
                                <Button variant="link" size="sm" onClick={toggleGlobal} className="mt-2 text-primary">
                                    Search Global Database
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-slate-800">
                                {globalMode ? "Search to find voters" : "All Assigned Done!"}
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">
                                {globalMode ? "Type a name or ID above." : "Switch to Global Mode if needed."}
                            </p>
                        </>
                    )}
                </div>
            )}

            {voted.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-dashed">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
                        Already Marked · {voted.length}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
                        {voted.map(v => <VoterCard key={v.id} voter={v} />)}
                    </div>
                </div>
            )}
        </div>
    );
}
