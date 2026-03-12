"use client";

import { Vote } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-500">
            <div className="relative flex flex-col items-center gap-6">
                {/* Logo Pulse Layer */}
                <div className="relative group">
                    {/* Glowing background pulse */}
                    <div className="absolute -inset-6 bg-primary/20 rounded-full blur-2xl animate-pulse group-hover:bg-primary/30 transition-all duration-1000" />

                    {/* Glass Circle */}
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-full border border-white/20 bg-white/5 shadow-2xl backdrop-blur-xl animate-float">
                        <Vote className="w-12 h-12 text-primary animate-pulse" />
                    </div>
                </div>

                {/* Branding & Status */}
                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-black tracking-widest text-foreground uppercase animate-reveal">
                        PNC <span className="text-primary">VMS</span>
                    </h2>

                    {/* Sleek Indeterminate Progress Bar */}
                    <div className="w-48 h-1 overflow-hidden bg-muted rounded-full border border-white/10">
                        <div className="w-full h-full bg-primary origin-left animate-loading-bar" />
                    </div>

                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-2 animate-pulse">
                        Synchronizing Database...
                    </p>
                </div>
            </div>

            {/* Ambient Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>
        </div>
    );
}
