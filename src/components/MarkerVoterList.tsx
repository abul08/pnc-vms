"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import { markVoterDoneAction, revertVoterAction } from "@/app/actions/voter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, RotateCcw, Search } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const BROADCAST_CHANNEL = "vms-votes";

function VoterCard({ voter }: { voter: any }) {
    const [isPending, startTransition] = useTransition();
    const [optimisticVoted, setOptimisticVoted] = useState<boolean>(voter.vote_status);
    const supabase = useRef(createClient()).current;

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
        });
    }

    function handleRevert() {
        setOptimisticVoted(false);
        startTransition(async () => {
            await revertVoterAction(voter.id);
            broadcast(false);
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
                {(voter.house_name || voter.present_address) && (
                    <p className="text-sm text-muted-foreground truncate">{voter.house_name || voter.present_address}</p>
                )}
            </div>
            <Button
                size="icon"
                className="shrink-0 h-10 w-10"
                disabled={isPending}
                onClick={handleMark}
                title="Mark as voted"
            >
                <CheckCircle2 className="w-5 h-5" />
            </Button>
        </div>
    );
}

export default function MarkerVoterList({ voters }: { voters: any[] }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return voters;
        return voters.filter(v =>
            v.name?.toLowerCase().includes(q) ||
            v.house_name?.toLowerCase().includes(q) ||
            v.present_address?.toLowerCase().includes(q) ||
            v.national_id?.includes(q)
        );
    }, [voters, search]);

    const pending = filtered.filter(v => !v.vote_status);
    const voted = filtered.filter(v => v.vote_status);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                    type="search"
                    placeholder="Search by name, address, ID…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="space-y-2">
                {pending.map(v => <VoterCard key={v.id} voter={v} />)}
                {pending.length === 0 && (
                    <div className="text-center py-12 rounded-xl border border-dashed">
                        <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        {search ? (
                            <>
                                <p className="font-semibold text-sm">No results</p>
                                <p className="text-muted-foreground text-sm">Try a different search.</p>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-sm">All Done!</p>
                                <p className="text-muted-foreground text-sm">No more voters remaining.</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {voted.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Voted · {voted.length}
                    </p>
                    {voted.map(v => <VoterCard key={v.id} voter={v} />)}
                </div>
            )}
        </div>
    );
}
