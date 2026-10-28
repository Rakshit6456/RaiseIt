"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"
import { useAuth } from "@/context/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function DashboardShell({ children, role: roleProp = "student" }) {
    const { currentUser, userData, loading, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [mobileNavOpen, setMobileNavOpen] = useState(false)

    // Close the mobile drawer whenever the route changes
    const [lastPathname, setLastPathname] = useState(pathname)
    if (pathname !== lastPathname) {
        setLastPathname(pathname)
        setMobileNavOpen(false)
    }

    // The role comes from the server-managed profile. (The proxy already stops
    // other roles reaching these routes; this is only for picking the sidebar.)
    const role = userData?.role || roleProp

    // No Firebase session (or no profile): clear the server cookie and go to login.
    const signedOut = !loading && (!currentUser || !userData)
    useEffect(() => {
        if (!signedOut) return
        logout().finally(() => router.replace("/auth/login"))
    }, [signedOut, logout, router])

    if (loading || signedOut) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen overflow-hidden bg-secondary/10">
            {/* Sidebar (desktop) */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
                <Sidebar role={role} />
            </aside>

            {/* Sidebar (mobile drawer) */}
            <div
                className={cn(
                    "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
                    mobileNavOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                aria-hidden={!mobileNavOpen}
            >
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setMobileNavOpen(false)}
                />
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 w-64 max-w-[80vw] transition-transform duration-300 ease-in-out",
                        mobileNavOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <Sidebar role={role} />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
                <Navbar onMenuClick={() => setMobileNavOpen(true)} />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
