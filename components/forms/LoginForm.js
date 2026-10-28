"use client"

import { useState } from "react"
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
import { useAuth } from "@/context/AuthContext"
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy"

function loginErrorMessage(err) {
    switch (err?.code) {
        case "auth/invalid-credential":
        case "auth/invalid-email":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "Invalid email or password."
        case "auth/user-disabled":
            return "This account has been disabled. Contact your administrator."
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later."
        case "auth/network-request-failed":
            return "Network error. Check your connection and try again."
        default:
            // Messages thrown by our own login flow are already user-safe.
            return err?.message && !err.code ? err.message : "Failed to sign in. Please try again."
    }
}

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

        const email = ensureInstitutionEmail(trimmedUsername)
        if (!isAllowedInstitutionEmail(email)) {
            setError("Only @iilm.edu email accounts can login.")
            return
        }

        setLoading(true)
        try {
            // The server validates the account and tells us where to go.
            const { redirectTo } = await login(email, password)
            router.push(redirectTo)
        } catch (err) {
            console.error("Login failed", err?.code || err?.message)
            setError(loginErrorMessage(err))
            setLoading(false)
        }
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
                            <span className="text-xs text-muted-foreground">
                                Forgot it? Ask your administrator.
                            </span>
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
