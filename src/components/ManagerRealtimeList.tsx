"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone, PhoneCallIcon, PhoneIcon } from "lucide-react";

const BROADCAST_CHANNEL = "vms-votes";

export default function ManagerRealtimeList({ initialVoters }: { initialVoters: any[] }) {
    const [voters, setVoters] = useState(initialVoters);
    const assignedIds = useRef(new Set(initialVoters.map((v: any) => v.id)));
    const [supabase] = useState(() => createClient());

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

    const groupedVoters = voters.reduce((acc: any[], voter: any) => {
        const key = voter.house_number || 'No House Number';
        let group = acc.find(g => g.houseNumber === key);
        if (!group) {
            group = { houseNumber: key, voters: [] };
            acc.push(group);
        }
        group.voters.push(voter);
        return acc;
    }, []);

    return (
        <div className="space-y-6">
            {groupedVoters.map((group) => (
                <div key={group.houseNumber} className="space-y-3">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm">
                            House {group.houseNumber}
                        </span>
                        <span className="text-sm text-muted-foreground font-normal">
                            ({group.voters.length} remaining)
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {group.voters.map((voter: any) => (
                            <div key={voter.id} className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl border bg-card">
                                <div className="min-w-0">
                                    <p className="font-semibold truncate">{voter.name}</p>
                                    {(voter.house_name || voter.present_address) && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {[voter.house_name || voter.present_address].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                                {voter.contact ? (
                                    <a
                                        href={`tel:${voter.contact}`}
                                        title={voter.contact}
                                        className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        <Phone className="w-4 h-4 text-primary" />
                                    </a>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic shrink-0">No contact</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
