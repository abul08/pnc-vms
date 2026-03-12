"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useActionState, useState, useEffect, useRef } from "react";
import { createVoterAction, updateVoterAction, deleteVoterAction, deleteAllVotersAction } from "@/app/actions/voterCrud";
import { resetAllVotingStatusAction } from "@/app/actions/voter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";

const BROADCAST_CHANNEL = "vms-votes";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, Plus, Search, Trash2, Edit2, X, Info, User, Home, Hash, MapPin, Phone, Fingerprint, ListChecks } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const initialState = { error: undefined as string | undefined, success: false, message: undefined as string | undefined };

const FIELDS = [
    { name: "name", label: "Name", required: true },
    { name: "house_name", label: "House" },
    { name: "national_id", label: "National ID" },
    { name: "sex", label: "Sex" },
    { name: "consit", label: "Constituency" },
    { name: "registered_box", label: "Box" },
    { name: "patch", label: "Patch" },
    { name: "contact", label: "Contact" },
    { name: "present_address", label: "Address" },
] as const;

function VoterDetailModal({ voter, open, onOpenChange }: { voter: any; open: boolean; onOpenChange: (open: boolean) => void }) {
    if (!voter) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary/10 p-2.5 rounded-xl">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">{voter.name}</DialogTitle>
                            <DialogDescription className="text-xs uppercase tracking-normal text-muted-foreground font-semibold">
                                Voter Details
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 pt-4">
                    <div className="bg-slate-50/50 p-2  rounded-2xl border border-slate-100 space-y-4">
                        {[
                            { icon: Fingerprint, label: "National ID", value: voter.national_id },
                            { icon: Home, label: "House", value: voter.house_name },
                            { icon: MapPin, label: "Present Address", value: voter.present_address },
                            { icon: ListChecks, label: "Constituency", value: voter.consit },
                            { icon: Hash, label: "Registered Box", value: voter.registered_box, highlight: true },
                            { icon: Hash, label: "Patch", value: voter.patch, highlight: true },
                            { icon: Phone, label: "Contact", value: voter.contact },
                            { icon: User, label: "Sex", value: voter.sex },
                        ].map((item, idx) => (
                            <div key={idx} className={cn("flex flex-col gap-1", idx > 0 && "mt-[-10px]")}>
                                <div className="flex items-center gap-2">
                                    <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-[12px] uppercase font-medium text-slate-400">{item.label}</span>
                                </div>
                                <span className={cn(
                                    "text-sm font-medium",
                                    item.highlight ? "text-primary bg-primary/10 px-1 rounded-lg w-fit mt-0.5" : "text-slate-800 ml-6"
                                )}>
                                    {item.value || "—"}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Voting Status</p>
                        </div>
                        <Badge variant={voter.vote_status ? "default" : "secondary"} className="h-6">
                            {voter.vote_status ? "Voted" : "Pending"}
                        </Badge>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto rounded-xl font-semibold">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function VoterFormFields({ defaults }: { defaults?: any }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FIELDS.map(f => (
                <div key={f.name} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{f.label}{(f as any).required ? " *" : ""}</label>
                    <Input name={f.name} defaultValue={defaults?.[f.name] ?? ""} required={(f as any).required} className="h-9 text-sm rounded-xl" />
                </div>
            ))}
        </div>
    );
}

function VoterRow({ voter, index, onEdit, onView }: { voter: any; index: number; onEdit: (v: any) => void; onView: (v: any) => void }) {
    const [delState, delAction, delPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await deleteVoterAction(fd);
            if (r?.success !== false) {
                // Since deleteVoterAction (in voterCrud.ts) returns { success: true }
                // We don't have broadcastStats here easily since it's in a sub-component
                // But we can trigger a refresh via the channel directly
                createClient().channel(BROADCAST_CHANNEL).send({
                    type: "broadcast",
                    event: "stats-update",
                    payload: {},
                });
            }
            return { ...initialState, ...r };
        },
        initialState
    );

    return (
        <>
            <TableRow
                className="text-sm cursor-pointer hover:bg-slate-50/80 group transition-colors"
                onClick={() => onView(voter)}
            >
                <TableCell className="text-muted-foreground font-mono text-[10px] tabular-nums hidden sm:table-cell pl-6">{index}</TableCell>
                <TableCell className="py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{voter.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono tabular-nums md:hidden">{voter.national_id}</span>
                    </div>
                </TableCell>
                <TableCell className="font-mono text-xs tabular-nums hidden md:table-cell">{voter.national_id || "—"}</TableCell>
                <TableCell className="text-slate-600 max-w-[150px] truncate">{voter.house_name || "—"}</TableCell>
                <TableCell className="hidden lg:table-cell">{voter.sex || "—"}</TableCell>
                <TableCell className="text-center font-bold text-primary tabular-nums hidden lg:table-cell">{voter.registered_box || "—"}</TableCell>
                <TableCell className="text-center font-bold text-blue-600 tabular-nums hidden lg:table-cell">{voter.patch || "—"}</TableCell>
                <TableCell className="text-center">
                    <Badge variant={voter.vote_status ? "default" : "secondary"} className="text-[10px] h-5 px-1.5 sm:px-2 min-w-[60px] justify-center">
                        {voter.vote_status ? "Voted" : "Pending"}
                    </Badge>
                </TableCell>
                <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); onEdit(voter); }}
                            className="h-8 w-8 rounded-full hover:bg-primary/5 hover:text-primary transition-colors"
                            title="Edit Voter"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <form action={delAction}>
                            <input type="hidden" name="id" value={voter.id} />
                            <Button
                                variant="ghost"
                                size="icon"
                                type="submit"
                                disabled={delPending}
                                className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/5 transition-colors"
                                onClick={e => { e.stopPropagation(); if (!confirm(`Delete ${voter.name}?`)) e.preventDefault(); }}
                                title="Delete Voter"
                            >
                                {delPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </Button>
                        </form>
                    </div>
                </TableCell>
            </TableRow>
        </>
    );
}

function VoterMobileCard({ voter, onEdit, onView }: { voter: any; onEdit: (v: any) => void; onView: (v: any) => void }) {
    const [delState, delAction, delPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await deleteVoterAction(fd);
            if (r?.success !== false) {
                createClient().channel(BROADCAST_CHANNEL).send({
                    type: "broadcast",
                    event: "stats-update",
                    payload: {},
                });
            }
            return { ...initialState, ...r };
        },
        initialState
    );

    return (
        <div
            className="px-6 py-4 bg-white border-b border-slate-100 last:border-0 active:bg-slate-50 transition-colors"
            onClick={() => onView(voter)}
        >
            <div className="flex justify-between items-start gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 truncate">{voter.name}</p>
                        <Badge variant={voter.vote_status ? "default" : "secondary"} className="text-[9px] h-4 px-1 shrink-0 uppercase tracking-tighter">
                            {voter.vote_status ? "Voted" : "Pending"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                        <Home className="w-3 h-3 shrink-0" />
                        <p className="text-xs truncate">{voter.house_name || "No House Name"}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Fingerprint className="w-3 h-3 shrink-0" />
                        <p className="text-[10px] font-mono tabular-nums">{voter.national_id || "—"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(voter); }} className="h-9 w-9 rounded-full bg-slate-50 text-slate-600">
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <form action={delAction}>
                        <input type="hidden" name="id" value={voter.id} />
                        <Button variant="ghost" size="icon" type="submit" disabled={delPending}
                            className="h-9 w-9 rounded-full bg-slate-50 text-destructive"
                            onClick={e => { e.stopPropagation(); if (!confirm(`Delete ${voter.name}?`)) e.preventDefault(); }}>
                            {delPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export function VotersCRUD({ initialVoters, page = 1, totalPages = 1, total = 0, pageSize = 500, q: initialSearch = "" }: {
    initialVoters: any[];
    page?: number;
    totalPages?: number;
    total?: number;
    pageSize?: number;
    q?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [showAdd, setShowAdd] = useState(false);
    const [search, setSearch] = useState(initialSearch);
    const [editingVoter, setEditingVoter] = useState<any>(null);
    const [viewingVoter, setViewingVoter] = useState<any>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const supabaseClient = useRef(createClient()).current;

    function broadcastStats() {
        supabaseClient.channel(BROADCAST_CHANNEL).send({
            type: "broadcast",
            event: "stats-update",
            payload: {},
        });
    }

    // Update local state if prop changes (e.g. browser back button)
    useEffect(() => {
        setSearch(initialSearch);
    }, [initialSearch]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (val) {
                params.set("q", val);
            } else {
                params.delete("q");
            }
            params.set("page", "1"); // Reset to page 1 on new search
            router.push(`${pathname}?${params.toString()}`);
        }, 400);
    };

    const [addState, addAction, addPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await createVoterAction(fd);
            if (r?.success) {
                setShowAdd(false);
                broadcastStats();
            }
            return { ...initialState, ...r };
        },
        initialState
    );
    const [editState, editAction, editPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await updateVoterAction(fd);
            if (r?.success) {
                setShowAdd(false);
                setEditingVoter(null);
                broadcastStats();
            }
            return { ...initialState, ...r };
        },
        initialState
    );

    const filtered = initialVoters;

    const handleEdit = (voter: any) => {
        setEditingVoter(voter);
        setShowAdd(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleAddClick = () => {
        if (showAdd && editingVoter) {
            setEditingVoter(null);
        } else {
            setShowAdd(!showAdd);
            setEditingVoter(null);
        }
    };

    return (
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-slate-100 min-h-[400px]">
            {/* Top Action Bar */}
            <div className="p-4 space-y-4 border-b border-slate-100 bg-slate-50/20">
                <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find voters by name or ID..."
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="h-11 pl-10 rounded-xl bg-white border-slate-200 focus:ring-primary/10 shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="grid grid-cols-2 gap-2 flex-1 md:flex-none">
                            <AlertDialog>
                                <AlertDialogTrigger render={
                                    <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl text-orange-600 border-orange-100 hover:bg-orange-50 font-bold text-[10px] uppercase tracking-wider">
                                        Reset Voting
                                    </Button>
                                } />
                                <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Reset all voting statuses?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will mark all voters as "Pending". This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl font-medium">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={async () => {
                                            const res = await resetAllVotingStatusAction();
                                            if (res.error) {
                                                alert(res.error);
                                            } else {
                                                broadcastStats();
                                            }
                                        }} className="bg-orange-600 hover:bg-orange-700 rounded-xl font-medium">
                                            Reset All
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger render={
                                    <Button size="sm" variant="outline" className="h-10 px-4 rounded-xl text-destructive border-destructive/5 hover:bg-destructive/5 font-bold text-[10px] uppercase tracking-wider">
                                        Delete All
                                    </Button>
                                } />
                                <AlertDialogContent className="border-destructive/20 rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-destructive font-bold">PERMANENT WIPEOUT</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will PERMANENTLY delete all voter records. This is irreversible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl font-medium">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={async () => {
                                            const res = await deleteAllVotersAction();
                                            if (res.error) {
                                                alert(res.error);
                                            } else {
                                                broadcastStats();
                                            }
                                        }} className="bg-destructive hover:bg-destructive/90 rounded-xl font-medium">
                                            Confirm Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <Button
                            onClick={handleAddClick}
                            variant={showAdd ? "outline" : "default"}
                            className="h-10 px-5 rounded-xl text-xs font-medium shadow-lg shadow-primary/10 tracking-tight shrink-0 flex items-center gap-2"
                        >
                            {showAdd ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4" /> Add Voter</>}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Registration/Edit Form */}
            {showAdd && (
                <div className="p-6 bg-white border-b border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-1.5 bg-primary rounded-full " />
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                    {editingVoter ? "Update Voter Record" : "New Voter Registration"}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{editingVoter ? `Editing ID: ${editingVoter.id}` : "Manual Entry Form"}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setShowAdd(false); setEditingVoter(null); }} className="rounded-full">
                            <X className="w-4 h-4 text-slate-400" />
                        </Button>
                    </div>
                    <form action={editingVoter ? editAction : addAction} className="space-y-6">
                        {editingVoter && <input type="hidden" name="id" value={editingVoter.id} />}
                        <VoterFormFields defaults={editingVoter} key={editingVoter?.id || "new"} />
                        {(addState?.error || editState?.error) && (
                            <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl flex items-center gap-3 text-destructive">
                                <Info className="w-4 h-4" />
                                <p className="text-xs font-bold">{addState?.error || editState?.error}</p>
                            </div>
                        )}
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={addPending || editPending} className="h-12 px-10 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {(addPending || editPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                {editingVoter ? "Confirm Updates" : "Register Voter"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Content Area */}
            <div className="relative">
                {/* Desktop Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader className="bg-slate-100/40 border-b border-slate-200">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-10 pl-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID</TableHead>
                                <TableHead className="pl-6 md:pl-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</TableHead>
                                <TableHead className="hidden lg:table-cell text-[10px] font-bold uppercase tracking-widest text-slate-500">National ID</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Residence</TableHead>
                                <TableHead className="hidden lg:table-cell text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Sex</TableHead>
                                <TableHead className="hidden lg:table-cell text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Box</TableHead>
                                <TableHead className="hidden lg:table-cell text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Patch</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</TableHead>
                                <TableHead className="text-right pr-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length > 0 ? (
                                filtered.map((v, i) => (
                                    <VoterRow
                                        key={v.id}
                                        voter={v}
                                        index={i + 1 + (page - 1) * pageSize}
                                        onEdit={handleEdit}
                                        onView={setViewingVoter}
                                    />
                                ))
                            ) : search ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-[300px] text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Search className="w-8 h-8 opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 tracking-tight">Zero matches for "{search}"</p>
                                                <p className="text-xs">Try searching for a name, ID or national code.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i} className="hover:bg-transparent">
                                        <TableCell className="hidden sm:table-cell pl-6"><Skeleton className="h-4 w-4 rounded-sm bg-slate-50" /></TableCell>
                                        <TableCell className="pl-6 sm:pl-4"><Skeleton className="h-5 w-48 rounded bg-slate-50" /></TableCell>
                                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24 rounded bg-slate-50" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32 rounded bg-slate-50" /></TableCell>
                                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-8 rounded bg-slate-50" /></TableCell>
                                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-10 rounded bg-slate-50" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 rounded-full bg-slate-50" /></TableCell>
                                        <TableCell className="text-right pr-6"><Skeleton className="h-9 w-20 ml-auto rounded-xl bg-slate-50" /></TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-slate-100 bg-white">
                    {filtered.length > 0 ? (
                        filtered.map((v) => (
                            <VoterMobileCard
                                key={v.id}
                                voter={v}
                                onEdit={handleEdit}
                                onView={setViewingVoter}
                            />
                        ))
                    ) : search ? (
                        <div className="p-20 text-center text-slate-300">
                            <Search className="w-10 h-10 opacity-10 mx-auto mb-4" />
                            <p className="text-sm font-bold tracking-tight text-slate-900">No results found</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Try another keyword</p>
                        </div>
                    ) : (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="p-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-5 w-[60%] bg-slate-50" />
                                    <Skeleton className="h-4 w-16 rounded-full bg-slate-50" />
                                </div>
                                <Skeleton className="h-4 w-[40%] bg-slate-50" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full bg-slate-50" />
                                    <Skeleton className="h-8 w-8 rounded-full bg-slate-50" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-1 bg-slate-200 rounded-full hidden sm:block" />
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                            Displaying <span className="text-slate-900 font-black">{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)}</span> of <span className="text-slate-900 font-black">{total.toLocaleString()}</span>
                        </p>
                    </div>
                    <Pagination className="w-auto mx-0">
                        <PaginationContent className="gap-2">
                            <PaginationItem>
                                <PaginationPrevious
                                    href={page > 1 ? `?page=${page - 1}${search ? `&q=${search}` : ""}` : "#"}
                                    aria-disabled={page <= 1}
                                    className={cn(
                                        "h-10 w-10 p-0 rounded-2xl border-slate-200 transition-all shadow-sm",
                                        page <= 1 ? "pointer-events-none opacity-40" : "bg-white hover:bg-slate-50 hover:shadow-md"
                                    )}
                                />
                            </PaginationItem>
                            <PaginationItem className="px-5">
                                <span className="text-xs font-black text-slate-900 tracking-tighter">
                                    <span className="text-primary">{page}</span>
                                    <span className="text-slate-300 mx-1.5 inline-block -rotate-20">/</span>
                                    {totalPages}
                                </span>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    href={page < totalPages ? `?page=${page + 1}${search ? `&q=${search}` : ""}` : "#"}
                                    aria-disabled={page >= totalPages}
                                    className={cn(
                                        "h-10 w-10 p-0 rounded-2xl border-slate-200 transition-all shadow-sm",
                                        page >= totalPages ? "pointer-events-none opacity-40" : "bg-white hover:bg-slate-50 hover:shadow-md"
                                    )}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
            <VoterDetailModal
                voter={viewingVoter}
                open={!!viewingVoter}
                onOpenChange={(open) => !open && setViewingVoter(null)}
            />
        </div>
    );
}
