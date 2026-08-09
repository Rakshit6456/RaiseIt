"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { User, Shield, Building2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { doc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase" // Ensure you have auth exported from lib/firebase if not present, checking imports
import { signOut } from "firebase/auth"
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy"

export function LoginForm({ username, password, onUsernameChange, onPasswordChange }) {
    const router = useRouter()
    const { login } = useAuth()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleLogin = async (e) => {
        e.preventDefault()
        setError("")

        const trimmedUsername = username.trim()
        if (!trimmedUsername) return

        let email = ensureInstitutionEmail(trimmedUsername)
        if (!isAllowedInstitutionEmail(email)) {
            setError("Only @iilm.edu email accounts can login.")
            return
        }

        setLoading(true)
        try {
            const userCredential = await login(email, password)
            const uid = userCredential.user.uid

            // Fetch User Role from Firestore
            const userDoc = await getDoc(doc(db, "users", uid))

            if (userDoc.exists()) {
                const userData = userDoc.data()
                const userRole = userData.role

                // Dynamic Redirection based on Role
                if (userRole === AUTH_POLICY.roles.student) {
                    router.push("/student/dashboard")
                } else if (userRole === AUTH_POLICY.roles.department) {
                    router.push("/department/dashboard")
                } else if (userRole === AUTH_POLICY.roles.admin) {
                    router.push("/admin/dashboard")
                } else {
                    setError("Unauthorized: Unrecognized role.")
                    await signOut(auth)
                }
            } else {
                setError("User profile not found. Please contact administrator.")
                await signOut(auth)
            }
        } catch (err) {
            console.error("Login failed", err)
            setError("Failed to sign in. Please check your credentials.")
        }
        setLoading(false)
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg border-t-4 border-t-primary">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                <CardDescription className="text-center">
                    Enter your credentials to access the portal
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email / User ID</Label>
                        <div className="flex rounded-md shadow-sm">
                            <Input
                                id="email"
                                type="text"
                                placeholder="username"
                                className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0"
                                required
                                value={username}
                                onChange={(e) => {
                                    let value = e.target.value
                                    if (value.includes("@")) {
                                        alert(`Please enter only the username part (e.g., 'john.doe'). The '@${AUTH_POLICY.allowedEmailDomain}' part is added automatically.`)
                                        value = value.replace(/@.*/, "")
                                    }
                                    onUsernameChange(value)
                                }}
                            />
                            <div className="bg-muted px-3 flex items-center border border-l-0 rounded-r-md text-sm text-muted-foreground font-medium select-none">
                                @{AUTH_POLICY.allowedEmailDomain}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
