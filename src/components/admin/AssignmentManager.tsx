"use client";

import { useActionState, useState } from "react";
import { assignAreaAction, unassignVoterAction, resetAllAssignmentsAction } from "@/app/actions/assignments";
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

export function AssignmentManager({ boxes, patches, users, assignments }: {
    boxes: string[];
    patches: string[];
    users: any[];
    assignments: any[];
}) {
    const [selectedArea, setSelectedArea] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedType, setSelectedType] = useState<"marker" | "manager">("marker");

    const [assignState, assignAction, assignPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await assignAreaAction(fd);
            if (r?.success) setSelectedArea("");
            return { ...initialState, ...r };
        },
        initialState
    );

    const [unassignState, unassignAction, unassignPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => ({ ...initialState, ...(await unassignVoterAction(fd)) }),
        initialState
    );

    const filteredUsers = users.filter(u => u.role === selectedType);
    const availableAreas = selectedType === "marker" ? boxes : patches;

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
                    <form action={assignAction} className="p-4 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">User Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    type="button" 
                                    variant={selectedType === "marker" ? "default" : "outline"}
                                    onClick={() => { setSelectedType("marker"); setSelectedArea(""); }}
                                    className="h-9 text-xs"
                                >
                                    Marker (per Box)
                                </Button>
                                <Button 
                                    type="button" 
                                    variant={selectedType === "manager" ? "default" : "outline"}
                                    onClick={() => { setSelectedType("manager"); setSelectedArea(""); }}
                                    className="h-9 text-xs"
                                >
                                    Manager (per Patch)
                                </Button>
                                <input type="hidden" name="type" value={selectedType} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                    {selectedType === "marker" ? "Select Registered Box" : "Select Patch"}
                                </label>
                                <select 
                                    name="assigned_value" 
                                    required
                                    value={selectedArea} 
                                    onChange={e => setSelectedArea(e.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select...</option>
                                    {availableAreas.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assign To User</label>
                                <select 
                                    name="user_id" 
                                    required
                                    value={selectedUser} 
                                    onChange={e => setSelectedUser(e.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select...</option>
                                    {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </select>
                            </div>
                        </div>

                        {assignState?.error && <p className="text-destructive text-[10px]">{assignState.error}</p>}
                        <Button type="submit" disabled={assignPending} className="w-full h-10">
                            {assignPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
                            Confirm Assignment
                        </Button>
                    </form>
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
                                    <TableHead className="py-2 h-9">Assigned Area</TableHead>
                                    <TableHead className="py-2 h-9">User</TableHead>
                                    <TableHead className="py-2 h-9 text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assignments.length > 0 ? (
                                    assignments.map((a: any) => (
                                        <TableRow key={a.id} className="text-sm">
                                            <TableCell className="py-2.5">
                                                <Badge variant="secondary" className="font-bold text-primary">
                                                    {a.type === 'marker' ? 'Box' : 'Patch'} {a.assigned_value}
                                                </Badge>
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
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground text-xs">No assignments found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
