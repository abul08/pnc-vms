"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone } from "lucide-react";

const BROADCAST_CHANNEL = "vms-votes";

export default function ManagerRealtimeList({ initialVoters }: { initialVoters: any[] }) {
    const [voters, setVoters] = useState(initialVoters);
    const assignedIds = useRef(new Set(initialVoters.map((v: any) => v.id)));
    const supabase = useRef(createClient()).current;

    useEffect(() => {
        const channel = supabase
            .channel(BROADCAST_CHANNEL)
            .on("broadcast", { event: "vote-update" }, ({ payload }) => {
                if (!payload) return;
                const updated = payload as any;
                if (!assignedIds.current.has(updated.id)) return;
                if (updated.vote_status === true) {
                    setVoters(prev => prev.filter(v => v.id !== updated.id));
                } else {
                    setVoters(prev => {
                        if (prev.some(v => v.id === updated.id)) return prev;
                        return [updated, ...prev];
                    });
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    if (voters.length === 0) {
        return (
            <div className="text-center py-16 rounded-2xl border border-dashed">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-500 rounded-full mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Patch Clear!</h3>
                <p className="text-muted-foreground text-sm mt-1">All voters in your patch have voted.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {voters.map((voter: any) => (
                <div key={voter.id} className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border-l-4 border-l-orange-400 border bg-card">
                    <div className="min-w-0">
                        <p className="font-semibold truncate">{voter.name}</p>
                        {(voter.house_name || voter.present_address) && (
                            <p className="text-sm text-muted-foreground truncate">{voter.house_name || voter.present_address}</p>
                        )}
                    </div>
                    {voter.contact ? (
                        <a
                            href={`tel:${voter.contact}`}
                            title={voter.contact}
                            className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Phone className="w-4 h-4" />
                        </a>
                    ) : (
                        <span className="text-xs text-muted-foreground italic shrink-0">No contact</span>
                    )}
                </div>
            ))}
        </div>
    );
}
