"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, ArrowLeft, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react"
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy"

const DEPARTMENT_COLORS = {
    "Electrical Department": "from-yellow-500 to-amber-600",
    "Plumbing Department": "from-blue-500 to-cyan-600",
    "IT Department": "from-purple-500 to-violet-600",
    "Hostel Warden": "from-green-500 to-emerald-600",
    "Infrastructure Team": "from-orange-500 to-red-600",
    "Sanitation Team": "from-teal-500 to-green-600",
    "Security Office": "from-slate-500 to-gray-600",
    "Library Administration": "from-rose-500 to-pink-600",
    "Head of Department": "from-indigo-500 to-blue-600",
    "College Principal": "from-red-500 to-rose-600",
}

export default function DepartmentLoginPage() {
    const router = useRouter()
    const { login } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const normalizedEmail = ensureInstitutionEmail(email)
            if (!isAllowedInstitutionEmail(normalizedEmail)) {
                setError("Only @iilm.edu email accounts can login.")
                setLoading(false)
                return
            }

            const result = await login(normalizedEmail, password)
            const user = result.user

            // Check Firestore for role
            const { doc, getDoc } = await import("firebase/firestore")
            const { db } = await import("@/lib/firebase")
            const userDoc = await getDoc(doc(db, "users", user.uid))

            if (!userDoc.exists()) {
                setError("Account not found in the system. Contact admin.")
                setLoading(false)
                return
            }

            const userData = userDoc.data()

            if (userData.role !== "department") {
                setError("This portal is for department accounts only. Use the correct login.")
                setLoading(false)
                return
            }

            router.push("/department/dashboard")
        } catch (err) {
            console.error("Department login error:", err)
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("Invalid email or password. Please try again.")
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many failed attempts. Please try again later.")
            } else {
                setError("Login failed. Please try again.")
            }
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side — Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 relative overflow-hidden flex-col items-center justify-center p-12 text-white">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 text-center space-y-8">
                    <div className="flex items-center justify-center gap-3">
                        <div className="relative w-12 h-12">
                            <Image src="/logo.png" alt="RaiseIt" fill className="object-contain" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight">RaiseIt</span>
                    </div>

                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20">
                            <Building2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold leading-tight">Department Portal</h2>
                        <p className="text-white/70 text-lg max-w-sm leading-relaxed">
                            Access your assigned complaints, track resolutions, and view department performance.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                        {["⚡ Electrical", "🔧 Plumbing", "💻 IT Dept", "🏗️ Infrastructure"].map((dept) => (
                            <div key={dept} className="bg-white/10 rounded-xl px-4 py-3 text-sm font-medium backdrop-blur-sm border border-white/10 text-center">
                                {dept}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side — Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background relative">
                <Link
                    href="/"
                    className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="flex lg:hidden items-center justify-center gap-2 mb-6">
                            <div className="relative w-8 h-8">
                                <Image src="/logo.png" alt="RaiseIt" fill className="object-contain" />
                            </div>
                            <span className="font-bold text-xl">RaiseIt</span>
                        </div>
                        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-semibold">
                            <Building2 className="w-4 h-4" />
                            Department Access
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Department Login</h1>
                        <p className="text-muted-foreground">
                            Sign in with your department credentials to access the portal.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email">Department Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={`electrical@${AUTH_POLICY.allowedEmailDomain}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                                <span className="mt-0.5">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25 transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Sign In to Department Portal
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Tips */}
                    <div className="border border-dashed rounded-xl p-4 bg-muted/20 space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ℹ️ For Admins</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Department accounts must be created by an administrator in Firebase with <code className="bg-muted px-1 py-0.5 rounded text-xs">role: &quot;department&quot;</code> and a <code className="bg-muted px-1 py-0.5 rounded text-xs">department</code> field set to the tagged authority name (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs">&quot;Electrical Department&quot;</code>).
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <Link href="/auth/login" className="hover:text-primary transition-colors">Student Login</Link>
                        <span>·</span>
                        <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Admin Portal</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
