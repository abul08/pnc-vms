"use client";

import { useActionState, useState } from "react";
import { updateUserAction, deleteUserAction } from "@/app/actions/users";
import { CreateUserForm } from "@/components/AdminForms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const ROLES = ["admin", "marker", "manager"] as const;
const initialState = { error: undefined as string | undefined, success: false, message: undefined as string | undefined };

const roleVariant: Record<string, "default" | "secondary" | "outline"> = {
    admin: "default",
    manager: "secondary",
    marker: "outline",
};

function UserCard({ user }: { user: any }) {
    const [editing, setEditing] = useState(false);
    const [editState, editAction, editPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => {
            const r = await updateUserAction(fd);
            if (r?.success) setEditing(false);
            return { ...initialState, ...r };
        },
        initialState
    );
    const [delState, delAction, delPending] = useActionState(
        async (_: typeof initialState, fd: FormData) => ({ ...initialState, ...(await deleteUserAction(fd)) }),
        initialState
    );

    if (editing) {
        return (
            <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                <form action={editAction} className="space-y-3">
                    <input type="hidden" name="id" value={user.id} />
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                        <Input name="full_name" defaultValue={user.full_name ?? ""} required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Role</label>
                        <select name="role" defaultValue={user.role}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    {editState?.error && <p className="text-xs text-destructive">{editState.error}</p>}
                    <div className="flex gap-2">
                        <Button type="submit" disabled={editPending} size="sm" className="flex-1">
                            {editPending ? "Saving…" : "Save"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setEditing(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
            <div className="min-w-0">
                <p className="font-semibold truncate">{user.full_name || <span className="text-muted-foreground italic text-sm">No name</span>}</p>
                <Badge variant={roleVariant[user.role] ?? "outline"} className="mt-1 text-xs">{user.role}</Badge>
                {delState?.error && <p className="text-xs text-destructive mt-1">{delState.error}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                <form action={delAction}>
                    <input type="hidden" name="id" value={user.id} />
                    <Button variant="destructive" size="sm" type="submit" disabled={delPending}
                        onClick={e => { if (!confirm(`Delete ${user.full_name}?`)) e.preventDefault(); }}>
                        {delPending ? "…" : "Delete"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export function UsersCRUD({ initialUsers }: { initialUsers: any[] }) {
    const [showCreate, setShowCreate] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{initialUsers.length} users</p>
                <Button variant={showCreate ? "outline" : "default"} size="sm" onClick={() => setShowCreate(v => !v)}>
                    {showCreate ? "Cancel" : "+ Add User"}
                </Button>
            </div>
            {showCreate && (
                <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm font-semibold mb-3">Create New User</p>
                    <CreateUserForm />
                </div>
            )}
            <div className="space-y-2">
                {initialUsers.map(u => <UserCard key={u.id} user={u} />)}
                {initialUsers.length === 0 && (
                    <p className="text-center py-10 text-muted-foreground text-sm">No users found.</p>
                )}
            </div>
        </div>
    );
}
