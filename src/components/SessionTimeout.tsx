"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function SessionTimeout() {
    const router = useRouter();
    const supabase = createClient();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        router.push("/login?reason=timeout");
        router.refresh();
    }, [supabase, router]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(logout, TIMEOUT_DURATION);
    }, [logout]);

    useEffect(() => {
        // Initial timer
        resetTimer();

        // Activity listeners
        const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
        
        const handleActivity = () => {
            resetTimer();
        };

        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    return null; // This component doesn't render anything
}
