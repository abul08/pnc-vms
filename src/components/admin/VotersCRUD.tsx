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
import { toast } from "sonner";

const initialState = { error: undefined as string | undefined, success: false, message: undefined as string | undefined };

const FIELDS = [
    { name: "name", label: "Name", required: true },
    { name: "house_name", label: "House" },
    { name: "national_id", label: "National ID" },
    { name: "registered_box", label: "Box" },
    { name: "patch", label: "Patch" },
    { name: "contact", label: "Contact" },
    { name: "present_location", label: "Present Location" },
] as const;

const TRACKING_FIELDS = [
    "nihadh", "athif", "nasheedha", "nasrath", "haniyya", "zahiyya", "sarumeela",
    "saeed", "saif", "shiyam", "alim", "yumna", "fareesha", "najeeba", "lamya",
    "samrath", "nuha", "faathun", "samaa", "rasheedha", "raashidha"
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
                            { icon: MapPin, label: "Present Location", value: voter.present_location },
                            { icon: Hash, label: "Registered Box", value: voter.registered_box, highlight: true },
                            { icon: Hash, label: "Patch", value: voter.patch, highlight: true },
                            { icon: Phone, label: "Contact", value: voter.contact },
                        ].map((item, idx) => (
                            <div key={idx} className={cn("flex flex-col gap-1", idx > 0 && "mt-[-10px]")}>
                                <div className="flex items-center gap-2">
                                    <item.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-[12px] uppercase font-medium text-slate-400">{item.label}</span>
                                </div>
                                <span className={cn(
                                    "text-sm font-medium",
                                    item.highlight ? "text-primary bg-primary/10 px-3 rounded-lg w-fit ml-6 mt-0.5" : "text-slate-800 ml-6"
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
            <div className="col-span-full pt-4 pb-2 border-t border-slate-100 mt-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-4">Numerical Tracking</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-y-3 gap-x-4">
                    {TRACKING_FIELDS.map(f => (
                        <div key={f} className="space-y-1">
                            <label htmlFor={`field-${f}`} className="text-[10px] font-semibold text-slate-500 capitalize px-1">
                                {f}
                            </label>
                            <Input
                                type="number"
                                name={f}
                                id={`field-${f}`}
                                defaultValue={defaults?.[f] ?? 0}
                                min={0}
                                className="h-8 text-xs font-mono tabular-nums rounded-lg focus:ring-primary/20"
                            />
                        </div>
                    ))}
                </div>
            </div>
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
                        <AlertDialog>
                            <AlertDialogTrigger render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/5 transition-colors"
                                    title="Delete Voter"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            } />
                            <AlertDialogContent onClick={(e) => e.stopPropagation()} className="rounded-2xl max-w-sm">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-destructive font-bold">Delete Voter?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete {voter.name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-row items-center justify-end gap-2 sm:gap-2">
                                    <AlertDialogCancel className="mt-0 flex-1 rounded-xl">Cancel</AlertDialogCancel>
                                    <form action={delAction} className="flex-1">
                                        <input type="hidden" name="id" value={voter.id} />
                                        <AlertDialogAction type="submit" disabled={delPending} className="w-full bg-destructive hover:bg-destructive/90 rounded-xl">
                                            {delPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                                            Delete
                                        </AlertDialogAction>
                                    </form>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
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
                    <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/20 text-primary">Box {voter.registered_box || "—"}</Badge>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-blue-200 text-blue-600">Patch {voter.patch || "—"}</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(voter); }} className="h-9 w-9 rounded-full bg-slate-50 text-slate-600">
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger render={
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-slate-50 text-destructive"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        } />
                        <AlertDialogContent onClick={(e) => e.stopPropagation()} className="rounded-2xl max-w-sm">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-destructive font-bold">Delete Voter?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete {voter.name}? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row items-center justify-end gap-2 sm:gap-2">
                                <AlertDialogCancel className="mt-0 flex-1 rounded-xl">Cancel</AlertDialogCancel>
                                <form action={delAction} className="flex-1">
                                    <input type="hidden" name="id" value={voter.id} />
                                    <AlertDialogAction type="submit" disabled={delPending} className="w-full bg-destructive hover:bg-destructive/90 rounded-xl">
                                        {delPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                                        Delete
                                    </AlertDialogAction>
                                </form>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}

export function VotersCRUD({ initialVoters, page = 1, totalPages = 1, total = 0, pageSize = 500, q: initialSearch = "", status = "all" }: {
    initialVoters: any[];
    page?: number;
    totalPages?: number;
    total?: number;
    pageSize?: number;
    q?: string;
    status?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [showAdd, setShowAdd] = useState(false);
    const [search, setSearch] = useState(initialSearch);
    const [editingVoter, setEditingVoter] = useState<any>(null);
    const [viewingVoter, setViewingVoter] = useState<any>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [supabaseClient] = useState(() => createClient());

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

    const handleStatusChange = (newStatus: string) => {
        const params = new URLSearchParams(window.location.search);
        if (newStatus && newStatus !== "all") {
            params.set("status", newStatus);
        } else {
            params.delete("status");
        }
        params.set("page", "1"); // Reset to page 1 on filter change
        router.push(`${pathname}?${params.toString()}`);
    };

    const [addState, addAction, addPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await createVoterAction(fd);
            if (r?.success) {
                setShowAdd(false);
                broadcastStats();
                toast.success(r.message || "Voter registered.");
            } else if (r?.error) {
                toast.error(r.error);
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
                toast.success(r.message || "Voter updated.");
            } else if (r?.error) {
                toast.error(r.error);
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
                <div className="flex flex-col gap-4">
                    {/* Primary Row: Search and Add Voter */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Find voters by name or ID..."
                                value={search}
                                onChange={e => handleSearchChange(e.target.value)}
                                className="h-11 pl-10 rounded-xl bg-white border-slate-200 focus:ring-primary/10 shadow-sm"
                            />
                        </div>

                        <Button
                            onClick={handleAddClick}
                            variant={showAdd ? "outline" : "default"}
                            className="h-11 px-6 rounded-xl text-xs font-semibold shadow-lg shadow-primary/10 tracking-normal flex items-center gap-2 shrink-0 transition-all active:scale-95"
                        >
                            {showAdd ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4" /> Add Voter</>}
                        </Button>
                    </div>

                    {/* Secondary Row: Status Filters and Danger Actions */}
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-center lg:self-auto w-full sm:w-auto">
                            {[
                                { id: "all", label: "All Records" },
                                { id: "voted", label: "Voted" },
                                { id: "pending", label: "Pending" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleStatusChange(item.id)}
                                    className={cn(
                                        "px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex-1 sm:flex-none text-center",
                                        status === item.id || (!status && item.id === "all")
                                            ? "bg-white text-primary shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger render={
                                    <Button size="sm" variant="outline" className="h-10 flex-1 lg:flex-none px-4 rounded-xl text-orange-600 border-orange-100 hover:bg-orange-50 font-bold text-[10px] uppercase tracking-wider transition-colors">
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
                                                toast.error(res.error);
                                            } else {
                                                broadcastStats();
                                                toast.success("Voting status reset for all.");
                                            }
                                        }} className="bg-orange-600 hover:bg-orange-700 rounded-xl font-medium">
                                            Reset All
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                                <AlertDialogTrigger render={
                                    <Button size="sm" variant="outline" className="h-10 flex-1 lg:flex-none px-4 rounded-xl text-destructive border-destructive/5 hover:bg-destructive/5 font-bold text-[10px] uppercase tracking-wider transition-colors">
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
                                                toast.error(res.error);
                                            } else {
                                                broadcastStats();
                                                toast.success("All voters deleted.");
                                            }
                                        }} className="bg-destructive hover:bg-destructive/90 rounded-xl font-medium">
                                            Confirm Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
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
                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">House Name</TableHead>
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
                                <TableRow>
                                    <TableCell colSpan={8} className="h-[300px] text-center">
                                        <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                <Info className="w-8 h-8 opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900 tracking-tight">No voters registered</p>
                                                <p className="text-xs">Click "Add Voter" or upload an Excel file to get started.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
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
                        <div className="p-20 text-center text-slate-300">
                            <Info className="w-10 h-10 opacity-10 mx-auto mb-4" />
                            <p className="text-sm font-bold tracking-normal text-slate-900">No voters yet</p>
                            <p className="text-[10px] font-normal tracking-normal text-slate-400 mt-1">Start by adding your first record</p>
                        </div>
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
                                    href={page > 1 ? `?page=${page - 1}${search ? `&q=${search}` : ""}${status && status !== "all" ? `&status=${status}` : ""}` : "#"}
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
                                    href={page < totalPages ? `?page=${page + 1}${search ? `&q=${search}` : ""}${status && status !== "all" ? `&status=${status}` : ""}` : "#"}
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
