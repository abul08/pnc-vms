import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import Navbar from '@/components/Navbar'
import SessionTimeout from '@/components/SessionTimeout'
import { Poppins, Geist, Hepta_Slab } from 'next/font/google'
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const hepta = Hepta_Slab({ subsets: ['latin'], variable: '--font-hepta' });

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800', '900'],
    variable: '--font-poppins',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'Voter Management System',
    description: 'Election Day Voter Management System',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={cn("font-sans", geist.variable, hepta.variable)}>
            <body className={`${poppins.className} antialiased min-h-screen bg-slate-50 text-slate-900 flex flex-col`}>
                <Navbar />
                <Toaster richColors position="top-right" />
                <SessionTimeout />
                <main className="flex-1 pb-16 sm:pb-0">
                    {children}
                </main>
            </body>
        </html>
    )
}
