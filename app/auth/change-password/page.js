"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { validatePassword } from "@/lib/password-policy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Shown after the first sign-in of an admin-created account (or any account an
// admin flagged for a reset). The proxy sends such sessions here until it is done.
export default function ChangePasswordPage() {
    const router = useRouter()
    const { currentUser, loading: authLoading, logout } = useAuth()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!authLoading && !currentUser) router.replace("/auth/login")
    }, [authLoading, currentUser, router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (newPassword !== confirmPassword) return setError("The new passwords do not match.")
        if (newPassword === currentPassword) return setError("Choose a password different from the current one.")
        const policyError = validatePassword(newPassword)
        if (policyError) return setError(policyError)

        const email = currentUser?.email
        if (!email) return setError("Your session has expired. Please sign in again.")

        setLoading(true)
        try {
            // Re-authenticate so the server sees fresh proof of the current password.
            const credential = await signInWithEmailAndPassword(auth, email, currentPassword)
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idToken: await credential.user.getIdToken(true),
                    newPassword,
                }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.message || "Could not change password.")

            // The server revoked old sessions; start a clean one with the new password.
            // Go through the normal login (admins need their security code again).
            await logout()
            router.replace("/auth/login")
        } catch (err) {
            if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
                setError("Your current password is incorrect.")
            } else if (err?.code) {
                setError("Could not change password. Please try again.")
            } else {
                setError(err.message || "Could not change password. Please try again.")
            }
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        await logout()
        router.replace("/auth/login")
    }

    if (authLoading || !currentUser) return null

    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Set a new password</CardTitle>
                    <CardDescription className="text-center">
                        Your administrator gave you a temporary password. Choose your own before continuing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 text-center">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current">Temporary password</Label>
                            <Input id="current" type="password" autoComplete="current-password" required
                                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new">New password</Label>
                            <Input id="new" type="password" autoComplete="new-password" required
                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                            <p className="text-[11px] text-muted-foreground">
                                At least 10 characters, with an uppercase letter, a lowercase letter and a number.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm new password</Label>
                            <Input id="confirm" type="password" autoComplete="new-password" required
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Saving..." : "Save password"}
                        </Button>
                        <Button type="button" variant="ghost" className="w-full" onClick={handleCancel} disabled={loading}>
                            Sign out
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
