"use client"

import { useState } from "react"
import { GraduationCap, ShieldCheck, Building2, Copy, Check } from "lucide-react"
import { DEMO_USERS } from "@/lib/demo-credentials"

const ROLE_ICONS = {
    student: GraduationCap,
    department: Building2,
    admin: ShieldCheck,
}

const ROLE_STYLES = {
    student: "bg-primary/10 text-primary border-primary/20",
    department: "bg-violet-100 text-violet-700 border-violet-200",
    admin: "bg-indigo-100 text-indigo-700 border-indigo-200",
}

export function DemoCredentials({ onSelect, selectedRole }) {
    const [copied, setCopied] = useState(null)

    const handleCopy = async (e, text, key) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(text)
            setCopied(key)
            setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500)
        } catch {
            // Clipboard API unavailable - silently ignore, credentials are still visible to copy manually
        }
    }

    return (
        <div className="w-full max-w-md mx-auto mt-6 border rounded-xl bg-muted/30 overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/50">
                <p className="text-sm font-bold flex items-center gap-2">
                    🔑 Demo Credentials
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Click a role to autofill the form and preview the platform as a Student, Department, or Admin.
                </p>
            </div>
            <div className="divide-y">
                {DEMO_USERS.map((user) => {
                    const Icon = ROLE_ICONS[user.role]
                    const isSelected = selectedRole === user.role
                    return (
                        <div
                            key={user.role}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelect?.(user)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault()
                                    onSelect?.(user)
                                }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 cursor-pointer
                                ${isSelected ? "bg-primary/5" : ""}`}
                        >
                            <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${ROLE_STYLES[user.role]}`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold">{user.label}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {user.email} &middot; {user.password}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => handleCopy(e, `${user.email} / ${user.password}`, user.role)}
                                title="Copy credentials"
                                className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                {copied === user.role ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
