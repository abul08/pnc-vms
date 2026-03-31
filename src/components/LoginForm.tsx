"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const initialState = { error: undefined as string | undefined };

export default function LoginForm() {
    const [state, formAction, isPending] = useActionState(
        async (_prev: typeof initialState, formData: FormData) => {
            const result = await loginAction(formData);
            return result ?? initialState;
        },
        initialState
    );

    return (
        <form action={formAction} className="space-y-4 p-2">
            <div className="space-y-1.5">
                <label className="text-m font-medium" htmlFor="username">Username</label>
                <Input id="username" name="username" type="text" required disabled={isPending} placeholder="username" />
            </div>
            <div className="space-y-1.5">
                <label className="text-m font-medium" htmlFor="password">Password</label>
                <Input id="password" name="password" type="password" required disabled={isPending} placeholder="••••••••" />
            </div>

            {state?.error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                    {state.error}
                </p>
            )}

            <Button type="submit" disabled={isPending} className="w-full mt-2">
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
            </Button>
        </form>
    );
}
