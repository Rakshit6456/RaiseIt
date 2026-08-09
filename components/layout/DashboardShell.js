"use client"

import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"
import { useAuth } from "@/context/AuthContext"
import { usePathname } from "next/navigation"

export function DashboardShell({ children, role: roleProp = "student" }) {
    const { userData, loading } = useAuth()
    const pathname = usePathname()

    // Role Detection Logic:
    // 1. Detect based on pathname (most reliable for layout).
    // 2. Persist role in sessionStorage so shared pages keep correct sidebar.
    // 3. Firebase userData.role always wins at the end.
    let role = roleProp
    if (pathname?.startsWith("/admin")) {
        role = "admin"
        if (typeof window !== "undefined") sessionStorage.setItem("raiseit_role", "admin")
    } else if (pathname?.startsWith("/department")) {
        role = "department"
        if (typeof window !== "undefined") sessionStorage.setItem("raiseit_role", "department")
    } else if (pathname?.startsWith("/student")) {
        role = "student"
        if (typeof window !== "undefined") sessionStorage.setItem("raiseit_role", "student")
    } else if (typeof window !== "undefined") {
        // Shared page (e.g. /forum/[id]) — use stored role
        const stored = sessionStorage.getItem("raiseit_role")
        if (stored) role = stored
    }
    // Firebase user role always wins
    if (userData?.role === "admin") role = "admin"
    if (userData?.role === "department" && !pathname?.startsWith("/admin")) role = "department"

    if (loading) {
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
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50">
                <Sidebar role={role} />
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
                <Navbar />
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
