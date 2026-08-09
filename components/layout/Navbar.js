"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { LogOut, User, Settings, ChevronDown, Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar({ onMenuClick }) {
    const { currentUser, userData, logout } = useAuth()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    
    const isFakeGuest = !currentUser || currentUser.isGuest
    const name = isFakeGuest ? "Guest User" : (userData?.name || currentUser?.displayName || currentUser?.email?.split("@")[0] || "User")
    
    let role = "student"
    if (isFakeGuest) {
        role = "guest"
    } else if (userData?.role) {
        role = userData.role
    }

    const displayRole = role.charAt(0).toUpperCase() + role.slice(1)

    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
            router.push("/")
        } catch (error) {
            console.error("Logout failed", error)
        }
    }

    return (
        <header className="h-16 border-b bg-card flex items-center px-4 sm:px-6 justify-between sticky top-0 z-50 shadow-sm gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    onClick={onMenuClick}
                    className="md:hidden shrink-0 p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    aria-label="Open navigation menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="font-medium text-lg text-muted-foreground truncate animate-in fade-in slide-in-from-left-4 duration-500">
                    <span className="hidden sm:inline">Welcome, </span>
                    <span className="text-primary font-bold">{name}</span>
                </div>
            </div>

            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-3 p-1.5 rounded-full transition-all duration-200 hover:bg-muted group focus:outline-none",
                        isOpen && "bg-muted"
                    )}
                >
                    <div className="text-right hidden sm:block pl-2">
                        <p className="text-sm font-bold leading-none text-foreground group-hover:text-primary transition-colors">{name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize font-medium">{displayRole}</p>
                    </div>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-bold text-sm shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
                            {name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                        <div className="p-1.5">
                            <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-semibold">Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}
