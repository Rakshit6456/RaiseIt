"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    PlusCircle,
    ListTodo,
    ShieldAlert,
    BarChart,
    Home,
    MessageSquare,
    Flame,
    CheckCircle,
    Building2,
    UserCircle,
    Inbox
} from "lucide-react"

const studentLinks = [
    { name: "My Dashboards", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Community Forum", href: "/student/forum", icon: MessageSquare },
    { name: "Report Issue", href: "/student/report", icon: PlusCircle },
    { name: "Track Issues", href: "/student/track", icon: ListTodo },
]

const adminLinks = [
    { name: "Resolution Center", href: "/admin/dashboard", icon: ShieldAlert },
    { name: "Manage Accounts", href: "/admin/accounts", icon: UserCircle },
    { name: "Browse Forums", href: "/admin/browse", icon: Flame },
    { name: "Global Statistics", href: "/admin/stats", icon: BarChart },
    { name: "Resolved Recently", href: "/admin/resolved", icon: CheckCircle },
]

const departmentLinks = [
    { name: "My Dashboard", href: "/department/dashboard", icon: LayoutDashboard },
    { name: "Community Forum", href: "/department/forum", icon: MessageSquare },
    { name: "Assigned Issues", href: "/department/dashboard", icon: Inbox },
    { name: "My Profile", href: "/department/profile", icon: UserCircle },
]

import Image from "next/image"

export function Sidebar({ role = "student" }) {
    const pathname = usePathname()
    const links = role === "admin" ? adminLinks : role === "department" ? departmentLinks : studentLinks

    const roleLabel = role === "admin" ? "Admin" : role === "department" ? "Department" : "Student"
    const roleBadgeColor = role === "admin" ? "bg-red-100 text-red-700" : role === "department" ? "bg-violet-100 text-violet-700" : "bg-indigo-100 text-indigo-700"

    return (
        <div className="flex flex-col h-full bg-card border-r w-64">
            <div className="p-6 border-b flex items-center gap-3">
                <div className="relative w-8 h-8">
                    <Image src="/logo.png" alt="RaiseIt" fill className="object-contain" />
                </div>
                <span className="font-bold text-lg tracking-tight">RaiseIt</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${roleBadgeColor}`}>{roleLabel}</span>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ease-in-out",
                                isActive
                                    ? "bg-primary/10 text-primary translate-x-1 font-semibold"
                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {link.name}
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors w-full"
                >
                    <Home className="w-5 h-5" />
                    Home Page
                </Link>
            </div>
        </div>
    )
}
