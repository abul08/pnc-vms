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
import { Search, Loader2, UserPlus, Trash2, User, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const initialState = { error: undefined as string | undefined, success: false, message: undefined as string | undefined };

export function AssignmentManager({ boxes, patches, users, assignments }: {
    boxes: string[];
    patches: string[];
    users: any[];
    assignments: any[];
}) {
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedType, setSelectedType] = useState<"marker" | "manager">("marker");

    const [assignState, assignAction, assignPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await assignAreaAction(fd);
            if (r?.success) {
                setSelectedAreas([]);
                setSearchTerm("");
                toast.success(r.message || "Areas assigned successfully");
            } else if (r?.error) {
                toast.error(r.error);
            }
            return { ...initialState, ...r };
        },
        initialState
    );

    const [unassignState, unassignAction, unassignPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await unassignVoterAction(fd);
            if (r?.success) {
                toast.success("Assignment removed");
            } else if (r?.error) {
                toast.error(r.error);
            }
            return { ...initialState, ...r };
        },
        initialState
    );

    const filteredUsers = users.filter(u => u.role === selectedType);
    const allAreas = selectedType === "marker" ? boxes : patches;
    
    // Filter out areas already assigned
    const assignedAreasSet = new Set(assignments.filter(a => a.type === selectedType).map(a => a.assigned_value));
    const availableAreas = allAreas.filter(a => !assignedAreasSet.has(a));
    
    // Search filter
    const searchableAreas = availableAreas.filter(a => a.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleArea = (area: string) => {
        setSelectedAreas(prev => 
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    const toggleAll = () => {
        if (selectedAreas.length === searchableAreas.length) {
            setSelectedAreas([]);
        } else {
            setSelectedAreas(searchableAreas);
        }
    };

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
                                    onClick={() => { setSelectedType("marker"); setSelectedAreas([]); setSearchTerm(""); }}
                                    className="h-9 text-xs"
                                >
                                    Marker (per Box)
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedType === "manager" ? "default" : "outline"}
                                    onClick={() => { setSelectedType("manager"); setSelectedAreas([]); setSearchTerm(""); }}
                                    className="h-9 text-xs"
                                >
                                    Manager (per Patch)
                                </Button>
                                <input type="hidden" name="type" value={selectedType} />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assign To User</label>
                                <select
                                    name="user_id"
                                    required
                                    value={selectedUser}
                                    onChange={e => setSelectedUser(e.target.value)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="">Select User...</option>
                                    {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        {selectedType === "marker" ? "Select Boxes" : "Select Patches"}
                                    </label>
                                    <Badge variant="secondary" className="text-[10px] tabular-nums">
                                        {selectedAreas.length} selected
                                    </Badge>
                                </div>
                                
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-8 h-9"
                                        />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchTerm("")}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-colors"
                                                aria-label="Clear search"
                                            >
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        )}
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={toggleAll}
                                        className="h-9 text-[10px] px-2"
                                    >
                                        {selectedAreas.length === searchableAreas.length && searchableAreas.length > 0 ? "Clear All" : "Select All"}
                                    </Button>
                                </div>

                                <div className="border rounded-md max-h-48 overflow-y-auto mt-2 bg-slate-50/50">
                                    <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                        {searchableAreas.length > 0 ? (
                                            searchableAreas.map(a => (
                                                <div 
                                                    key={a}
                                                    onClick={() => toggleArea(a)}
                                                    className={`
                                                        flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-xs
                                                        ${selectedAreas.includes(a) 
                                                            ? "bg-primary/10 border-primary/20 border text-primary font-medium" 
                                                            : "hover:bg-muted border border-transparent"}
                                                    `}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selectedAreas.includes(a) ? "bg-primary border-primary" : "bg-white border-muted-foreground/30"}`}>
                                                        {selectedAreas.includes(a) && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                    </div>
                                                    <span className="truncate">{a}</span>
                                                    {/* Hidden inputs to send values with the form */}
                                                    {selectedAreas.includes(a) && <input type="hidden" name="assigned_values" value={a} />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-4 text-center text-muted-foreground text-xs italic">
                                                {searchTerm ? "No results found." : "All areas assigned or none available."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {assignState?.error && <p className="text-destructive text-[10px]">{assignState.error}</p>}
                        <Button type="submit" disabled={assignPending || selectedAreas.length === 0 || !selectedUser} className="w-full h-10 shadow-sm">
                            {assignPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
                            Confirm {selectedAreas.length} Assignment{selectedAreas.length !== 1 ? "s" : ""}
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
                                        if (res.error) {
                                            toast.error(res.error);
                                        } else {
                                            toast.success("All assignments reset");
                                        }
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
                                                <Badge variant="secondary" className="font-semibold text-primary">
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
                                                <AlertDialog>
                                                    <AlertDialogTrigger render={
                                                        <Button variant="ghost" size="icon" disabled={unassignPending}
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                                            {unassignPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                                        </Button>
                                                    } />
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will remove the assignment for {a.profiles?.full_name}. They will no longer be assigned to this {a.type === 'marker' ? 'box' : 'patch'}.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="flex-row align-center justify-center gap-2 sm:gap-2">
                                                            <AlertDialogCancel className="px-10">Cancel</AlertDialogCancel>
                                                            <form action={unassignAction}>
                                                                <input type="hidden" name="id" value={a.id} />
                                                                <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90 px-10">
                                                                    Remove
                                                                </AlertDialogAction>
                                                            </form>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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
