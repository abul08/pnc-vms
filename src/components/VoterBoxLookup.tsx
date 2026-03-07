"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { lookupVoterByIdAction } from "@/app/actions/lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Search, Loader2 } from "lucide-react";

export default function VoterBoxLookup({ label = "Check Registered Box" }: { label?: string }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [isPending, startTransition] = useTransition();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset state when dialog closes
    useEffect(() => {
        if (!open) {
            setQuery("");
            setSuggestions([]);
            setSelected(null);
        }
    }, [open]);

    // Debounced live search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 2) {
            setSuggestions([]);
            setSelected(null);
            return;
        }

        debounceRef.current = setTimeout(() => {
            setSelected(null);
            startTransition(async () => {
                const res = await lookupVoterByIdAction(query);
                setSuggestions(res.voters ?? []);
            });
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function handleSelect(voter: any) {
        setSelected(voter);
        setSuggestions([]);
        setQuery(voter.name);
    }

    const showSuggestions = !selected && suggestions.length > 0 && query.trim().length >= 2;

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
                <MapPin className="w-4 h-4" />
                {label}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md gap-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            Check Registered Box
                        </DialogTitle>
                    </DialogHeader>

                    {/* Search input */}
                    <div className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            {isPending && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                            )}
                            <Input
                                autoFocus
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelected(null); }}
                                placeholder="Type name or National ID…"
                                className="pl-9 pr-9"
                            />
                        </div>

                        {/* Suggestion dropdown */}
                        {showSuggestions && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border rounded-lg shadow-lg overflow-hidden">
                                {suggestions.map((v, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => handleSelect(v)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{v.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{v.national_id}</p>
                                        </div>
                                        <span className="ml-3 text-base font-black text-primary shrink-0">{v.registered_box || "—"}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* No results hint */}
                        {!isPending && query.trim().length >= 2 && !selected && suggestions.length === 0 && (
                            <p className="absolute top-full mt-1 left-0 text-xs text-muted-foreground px-1">
                                No voter found
                            </p>
                        )}
                    </div>

                    {/* Selected voter — hero result */}
                    {selected && (
                        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                            <div className="h-1 w-full bg-linear-to-r from-primary to-green-400" />
                            <div className="flex flex-col items-center py-5 border-b">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Registered Box</p>
                                <p className="text-6xl font-black text-primary leading-none">{selected.registered_box || "—"}</p>
                            </div>
                            <div className="flex divide-x">
                                <div className="flex-1 px-4 py-3">
                                    <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                                    <p className="font-semibold text-sm">{selected.name}</p>
                                </div>
                                <div className="flex-1 px-4 py-3">
                                    <p className="text-xs text-muted-foreground mb-0.5">National ID</p>
                                    <p className="font-mono text-sm">{selected.national_id}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
