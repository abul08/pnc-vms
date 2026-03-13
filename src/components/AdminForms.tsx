"use client";

import { useActionState } from "react";
import { createUserAction } from "@/app/actions/admin";
import { uploadExcelAction } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const initialState = { error: undefined as string | undefined, success: false, message: undefined as string | undefined };

function StatusMessage({ type, message }: { type: "error" | "success"; message: string }) {
    const isError = type === "error";
    return (
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${isError ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"
            }`}>
            {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {message}
        </div>
    );
}

export function CreateUserForm() {
    const [state, formAction, isPending] = useActionState(
        async (_prev: typeof initialState, formData: FormData) => {
            const result = await createUserAction(formData);
            if (result.success) {
                toast.success(result.message || "User created successfully");
            } else if (result.error) {
                toast.error(result.error);
            }
            return { ...initialState, ...result };
        },
        initialState
    );

    return (
        <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input name="full_name" type="text" required disabled={isPending} placeholder="John Doe" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Role</label>
                    <select
                        name="role"
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="marker">Marker</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Username</label>
                <Input name="username" type="text" required disabled={isPending} placeholder="marker_01" />
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <Input name="password" type="password" required minLength={6} disabled={isPending} placeholder="••••••••" />
            </div>

            {state?.error && <StatusMessage type="error" message={state.error} />}
            {state?.success && state.message && <StatusMessage type="success" message={state.message} />}

            <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating…</> : "Create User"}
            </Button>
        </form>
    );
}

export function UploadExcelForm() {
    const [state, formAction, isPending] = useActionState(
        async (_prev: typeof initialState, formData: FormData) => {
            const result = await uploadExcelAction(formData);
            if (result.success) {
                toast.success(result.message || "Database uploaded successfully");
            } else if (result.error) {
                toast.error(result.error);
            }
            return { ...initialState, ...result };
        },
        initialState
    );

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Excel Tracker File</label>
                <Input
                    type="file"
                    name="file"
                    required
                    disabled={isPending}
                    accept=".xlsx, .xls, .csv"
                    className="cursor-pointer file:cursor-pointer"
                />
                <p className="text-[10px] text-muted-foreground italic">Accepts .xlsx, .xls, .csv</p>
            </div>

            {state?.error && <StatusMessage type="error" message={state.error} />}
            {state?.success && state.message && <StatusMessage type="success" message={state.message} />}

            <Button type="submit" disabled={isPending} variant="default">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Uploading…</> : "Upload Database"}
            </Button>
        </form>
    );
}

