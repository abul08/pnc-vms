"use client";

import { useActionState, useState } from "react";
import { createVoterAction, updateVoterAction, deleteVoterAction } from "@/app/actions/voterCrud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, Search, Trash2, Edit2, X, Check } from "lucide-react";

const initialState = { error: undefined as string | undefined, success: false, message: undefined as string | undefined };

const FIELDS = [
    { name: "name", label: "Name", required: true },
    { name: "house_name", label: "House" },
    { name: "national_id", label: "National ID" },
    { name: "sex", label: "Sex" },
    { name: "consit", label: "Constituency" },
    { name: "registered_box", label: "Box" },
    { name: "contact", label: "Contact" },
    { name: "present_address", label: "Address" },
] as const;

function VoterFormFields({ defaults }: { defaults?: any }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FIELDS.map(f => (
                <div key={f.name} className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{f.label}{(f as any).required ? " *" : ""}</label>
                    <Input name={f.name} defaultValue={defaults?.[f.name] ?? ""} required={(f as any).required} className="h-9 text-sm" />
                </div>
            ))}
        </div>
    );
}

function VoterRow({ voter, index }: { voter: any; index: number }) {
    const [editing, setEditing] = useState(false);
    const [editState, editAction, editPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await updateVoterAction(fd);
            if (r?.success) setEditing(false);
            return { ...initialState, ...r };
        },
        initialState
    );
    const [delState, delAction, delPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => ({ ...initialState, ...(await deleteVoterAction(fd)) }),
        initialState
    );

    if (editing) {
        return (
            <TableRow className="bg-muted/30">
                <TableCell colSpan={8} className="p-4">
                    <form action={editAction} className="space-y-4">
                        <input type="hidden" name="id" value={voter.id} />
                        <VoterFormFields defaults={voter} />
                        {editState?.error && <p className="text-destructive text-xs">{editState.error}</p>}
                        <div className="flex gap-2">
                            <Button type="submit" disabled={editPending} size="sm">
                                {editPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                Save Changes
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                        </div>
                    </form>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow className="text-sm">
            <TableCell className="text-muted-foreground font-mono text-[10px]">{index}</TableCell>
            <TableCell className="font-medium">{voter.name}</TableCell>
            <TableCell className="font-mono text-xs">{voter.national_id || "—"}</TableCell>
            <TableCell>{voter.house_name || "—"}</TableCell>
            <TableCell>{voter.sex || "—"}</TableCell>
            <TableCell className="font-bold text-primary">{voter.registered_box || "—"}</TableCell>
            <TableCell>
                <Badge variant={voter.vote_status ? "default" : "secondary"} className="text-[10px] h-5">
                    {voter.vote_status ? "Voted" : "Pending"}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                    {delState?.error && <span className="text-destructive text-[10px] mr-2">{delState.error}</span>}
                    <Button variant="ghost" size="icon" onClick={() => setEditing(true)} className="h-8 w-8">
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <form action={delAction}>
                        <input type="hidden" name="id" value={voter.id} />
                        <Button variant="ghost" size="icon" type="submit" disabled={delPending}
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={e => { if (!confirm(`Delete ${voter.name}?`)) e.preventDefault(); }}>
                            {delPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                    </form>
                </div>
            </TableCell>
        </TableRow>
    );
}

export function VotersCRUD({ initialVoters, page = 1, totalPages = 1, total = 0, pageSize = 500 }: {
    initialVoters: any[];
    page?: number;
    totalPages?: number;
    total?: number;
    pageSize?: number;
}) {
    const [showAdd, setShowAdd] = useState(false);
    const [search, setSearch] = useState("");

    const [addState, addAction, addPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await createVoterAction(fd);
            if (r?.success) setShowAdd(false);
            return { ...initialState, ...r };
        },
        initialState
    );

    const filtered = initialVoters.filter(v =>
        !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.national_id?.includes(search)
    );

    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or ID…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
                <Button size="sm" onClick={() => setShowAdd(v => !v)} variant={showAdd ? "outline" : "default"}>
                    {showAdd ? <><X className="w-4 h-4 mr-2" /> Cancel</> : <><Plus className="w-4 h-4 mr-2" /> Add Voter</>}
                </Button>
            </div>

            {showAdd && (
                <div className="p-4 bg-muted/20 border-b space-y-4">
                    <h3 className="text-sm font-semibold">New Voter Registration</h3>
                    <form action={addAction} className="space-y-4">
                        <VoterFormFields />
                        {addState?.error && <p className="text-destructive text-xs">{addState.error}</p>}
                        <div className="flex gap-2">
                            <Button type="submit" disabled={addPending} size="sm">
                                {addPending && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                Register Voter
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-10">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>National ID</TableHead>
                            <TableHead>House</TableHead>
                            <TableHead>Sex</TableHead>
                            <TableHead>Box</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((v, i) => <VoterRow key={v.id} voter={v} index={i + 1 + (page - 1) * pageSize} />)}
                        {filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    {search ? "No results found." : "Voter database is empty."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 bg-muted/10 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
                    </p>
                    <Pagination className="w-auto mx-0">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href={page > 1 ? `?page=${page - 1}` : "#"}
                                    aria-disabled={page <= 1}
                                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                            <PaginationItem className="hidden sm:block">
                                <span className="px-4 text-xs font-medium">Page {page} of {totalPages}</span>
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    href={page < totalPages ? `?page=${page + 1}` : "#"}
                                    aria-disabled={page >= totalPages}
                                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
