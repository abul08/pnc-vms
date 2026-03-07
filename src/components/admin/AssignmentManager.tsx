"use client";

import { useActionState, useState } from "react";
import { assignVoterAction, unassignVoterAction, resetAllAssignmentsAction } from "@/app/actions/assignments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, UserPlus, Trash2, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const initialState = { error: undefined as string | undefined, success: false, message: undefined as string | undefined };

export function AssignmentManager({ voters, users, assignments }: {
    voters: any[];
    users: any[];
    assignments: any[];
}) {
    const [voterSearch, setVoterSearch] = useState("");
    const [selectedVoter, setSelectedVoter] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedType, setSelectedType] = useState<"marker" | "manager">("marker");

    const [assignState, assignAction, assignPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await assignVoterAction(fd);
            if (r?.success) setSelectedVoter(null);
            return { ...initialState, ...r };
        },
        initialState
    );

    const [unassignState, unassignAction, unassignPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => ({ ...initialState, ...(await unassignVoterAction(fd)) }),
        initialState
    );

    const filteredVoters = voters.filter(v =>
        !voterSearch || v.name?.toLowerCase().includes(voterSearch.toLowerCase()) || v.national_id?.includes(voterSearch)
    );

    const filteredUsers = users.filter(u => u.role === selectedType);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm border-muted">
                <CardHeader className="pb-3 px-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        Create Assignment
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="px-4 pb-4">
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Find voter..."
                                value={voterSearch}
                                onChange={e => setVoterSearch(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded-lg divide-y bg-muted/5">
                            {filteredVoters.map(v => (
                                <button key={v.id} type="button" onClick={() => setSelectedVoter(v)}
                                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-muted ${selectedVoter?.id === v.id ? "bg-primary/10 text-primary font-semibold ring-1 ring-inset ring-primary/20" : ""}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="truncate">{v.name}</span>
                                        <span className="text-[10px] font-mono text-muted-foreground ml-2 shrink-0 tabular-nums">{v.national_id}</span>
                                    </div>
                                </button>
                            ))}
                            {filteredVoters.length === 0 && <p className="px-3 py-8 text-center text-muted-foreground text-xs">No voters found.</p>}
                        </div>
                    </div>

                    {selectedVoter && (
                        <form action={assignAction} className="p-4 space-y-4 bg-muted/20 border-t">
                            <input type="hidden" name="voter_id" value={selectedVoter.id} />
                            <div className="flex items-start gap-3">
                                <div className="bg-primary/10 p-2 rounded-lg">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Assigning Voter</p>
                                    <p className="text-sm font-bold truncate">{selectedVoter.name}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</label>
                                    <select name="type" value={selectedType} onChange={e => setSelectedType(e.target.value as any)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                                        <option value="marker">Marker</option>
                                        <option value="manager">Manager</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assign To</label>
                                    <select name="user_id" required
                                        value={selectedUser} onChange={e => setSelectedUser(e.target.value)}
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                                        <option value="">Select...</option>
                                        {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            {assignState?.error && <p className="text-destructive text-[10px]">{assignState.error}</p>}
                            <Button type="submit" disabled={assignPending} className="w-full h-9">
                                {assignPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
                                Confirm Assignment
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-sm border-muted">
                <CardHeader className="pb-3 px-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Assignments</CardTitle>
                    <div className="flex items-center gap-2">
                        <AlertDialog>
                            <AlertDialogTrigger render={<Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 text-destructive hover:bg-destructive/10">Reset All</Button>} />
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset all assignments?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will clear all voter assignments for markers and managers. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={async () => {
                                        const res = await resetAllAssignmentsAction();
                                        if (res.error) alert(res.error);
                                    }} className="bg-destructive hover:bg-destructive/90">
                                        Reset All
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <Badge variant="outline" className="text-[10px] tabular-nums">{assignments.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-y-auto max-h-[600px]">
                        <Table>
                            <TableHeader className="bg-muted/30 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="py-2 h-9">Voter</TableHead>
                                    <TableHead className="py-2 h-9">Assigned To</TableHead>
                                    <TableHead className="py-2 h-9 text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.length > 0 ? (
                                    assignments.map((a: any) => (
                                        <TableRow key={a.id} className="text-sm">
                                            <TableCell className="py-2.5">
                                                <p className="font-semibold leading-none mb-1">{a.voters?.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono tabular-nums">{a.voters?.national_id}</p>
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">{a.profiles?.full_name}</span>
                                                    <Badge variant="outline" className="text-[8px] h-3 px-1 w-fit mt-1 uppercase opacity-70">
                                                        {a.type}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-right">
                                                <form action={unassignAction}>
                                                    <input type="hidden" name="id" value={a.id} />
                                                    <Button variant="ghost" size="icon" type="submit" disabled={unassignPending}
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={e => { if (!confirm("Remove this assignment?")) e.preventDefault(); }}>
                                                        {unassignPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                    </Button>
                                                </form>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-10 w-32 bg-slate-50" /></TableCell>
                                            <TableCell><Skeleton className="h-10 w-24 bg-slate-50" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto bg-slate-50" /></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
