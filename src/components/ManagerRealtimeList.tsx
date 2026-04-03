"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Phone, UserRound } from "lucide-react";

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
                        return [...prev, updated].sort((a, b) => {
                            const numA = a.house_number || '';
                            const numB = b.house_number || '';
                            return String(numA).localeCompare(String(numB), undefined, { numeric: true, sensitivity: 'base' });
                        });
                    });
                }
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    if (voters.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4 pt-4 gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Patch Manager</h1>
                        <p className="text-slate-500 text-sm mt-0.5">0 voters remaining</p>
                    </div>
                </div>
                <div className="text-center py-16 rounded-2xl border border-dashed">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 text-green-500 rounded-full mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-semibold text-lg">Patch Clear!</h3>
                    <p className="text-muted-foreground text-sm mt-1">All voters in your patch have voted.</p>
                </div>
            </div>
        );
    }

    const groupedVoters = voters.reduce((acc: any[], voter: any) => {
        const key = voter.house_number || 'No House Number';
        let group = acc.find(g => g.houseNumber === key);
        if (!group) {
            group = { houseNumber: key, house_name: voter.house_name || `House ${key}`, voters: [] };
            acc.push(group);
        }
        group.voters.push(voter);
        return acc;
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-4 pt-4 gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Patch Manager</h1>
                    <p className="text-slate-500 text-sm mt-0.5">{voters.length} voter{voters.length !== 1 ? 's' : ''} remaining</p>
                </div>
            </div>
            {groupedVoters.map((group) => (
                <div key={group.houseNumber} className="space-y-3">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm">
                            {group.house_name}
                        </span>
                        <span className="text-sm text-muted-foreground font-normal">
                            ({group.voters.length} remaining)
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {group.voters.map((voter: any) => (
                            <div key={voter.id} className="flex items-center justify-between gap-3 px-4 py-2 rounded-xl border bg-card">
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-700 truncate">{voter.name}</p>
                                    {(voter.incharge || voter.contact) && (
                                        <div className="flex items-center gap-1.5 mt-0.5 text-xs truncate">
                                            {voter.incharge && (
                                                <span className="text-primary font-medium truncate flex items-center gap-1">
                                                    <UserRound className="w-3 h-3 shrink-0" />
                                                    {voter.incharge}
                                                </span>
                                            )}
                                            {voter.incharge && voter.contact && (
                                                <span className="text-slate-300 shrink-0">·</span>
                                            )}
                                            {voter.contact && (
                                                <span className="text-muted-foreground truncate">{voter.contact}</span>
                                            )}
                                        </div>
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
