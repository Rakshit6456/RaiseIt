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
import { Check, ChevronRight, ChevronLeft, User, Shield, Building2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import {
    AUTH_POLICY,
    ensureInstitutionEmail,
    isAllowedInstitutionEmail,
} from "@/lib/auth-policy"

export function RegisterForm() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [role, setRole] = useState(AUTH_POLICY.roles.student)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const { signup } = useAuth()

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        studentId: "",
        adminCode: ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleNext = () => {
        setStep(prev => prev + 1)
    }

    const handleBack = () => {
        setStep(prev => prev - 1)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        if (!AUTH_POLICY.allowPublicSignup) {
            setError("Self signup is disabled. Contact admin to create your account.")
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters")
            return
        }

        const normalizedEmail = ensureInstitutionEmail(formData.email)
        if (!isAllowedInstitutionEmail(normalizedEmail)) {
            setError("Only @iilm.edu email accounts are allowed.")
            return
        }

        if (!AUTH_POLICY.allowedSelfSignupRoles.includes(role)) {
            setError("This role cannot self-register. Contact admin.")
            return
        }

        setLoading(true)
        try {
            // 1. Create User in Firebase Auth
            const userCredential = await signup(normalizedEmail, formData.password)
            const user = userCredential.user

            // 2. Create User Document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: formData.name,
                email: normalizedEmail,
                role: role,
                studentId: role === "student" ? formData.studentId : null,
                adminCode: null,
                createdAt: serverTimestamp(),
            })

            router.push("/auth/login")
        } catch (err) {
            console.error("Registration failed", err)
            setError(err.message || "Failed to create account")
        }
        setLoading(false)
    }

    return (
        <Card className="w-full max-w-lg mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Create Account</CardTitle>
                <CardDescription className="text-center">
                    Step {step} of 3: {step === 1 ? "Select Role" : step === 2 ? "Personal Info" : "Verification"}
                </CardDescription>

                {/* Progress Bar */}
                <div className="flex gap-2 mt-4">
                    <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
                    <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
                    <div className={`h-1 flex-1 rounded-full ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
                </div>
            </CardHeader>

            <CardContent>
                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 text-center">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    {/* Step 1: Role Selection */}
                    {step === 1 && (
                        <div className="grid grid-cols-3 gap-3 py-4">
                            <button
                                type="button"
                                onClick={() => setRole(AUTH_POLICY.roles.student)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === AUTH_POLICY.roles.student
                                    ? "border-primary bg-primary/5 text-primary scale-105"
                                    : "border-muted hover:border-muted-foreground/50 text-muted-foreground"
                                    }`}
                            >
                                <div className="p-2 bg-background rounded-full shadow-sm mb-2">
                                    <User className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-semibold">Student</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole(AUTH_POLICY.roles.department)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === AUTH_POLICY.roles.department
                                    ? "border-primary bg-primary/5 text-primary scale-105"
                                    : "border-muted hover:border-muted-foreground/50 text-muted-foreground"
                                    }`}
                            >
                                <div className="p-2 bg-background rounded-full shadow-sm mb-2">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-semibold">Dept</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole(AUTH_POLICY.roles.admin)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === AUTH_POLICY.roles.admin
                                    ? "border-primary bg-primary/5 text-primary scale-105"
                                    : "border-muted hover:border-muted-foreground/50 text-muted-foreground"
                                    }`}
                            >
                                <div className="p-2 bg-background rounded-full shadow-sm mb-2">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-semibold">Admin</span>
                            </button>
                        </div>
                    )}

                    {/* Step 2: Personal Details */}
                    {step === 2 && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="flex rounded-md shadow-sm">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="text"
                                        placeholder={role === AUTH_POLICY.roles.student ? "john" : "admin"}
                                        value={formData.email.split('@')[0]}
                                        onChange={(e) => {
                                            if (e.target.value.includes("@")) {
                                                alert(`Please enter only the username part. The '@${AUTH_POLICY.allowedEmailDomain}' domain is fixed.`)
                                                return
                                            }
                                            handleChange({
                                                target: {
                                                    name: 'email',
                                                    value: `${e.target.value}@${AUTH_POLICY.allowedEmailDomain}`
                                                }
                                            })
                                        }}
                                        className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0"
                                        required
                                    />
                                    <div className="bg-muted px-3 flex items-center border border-l-0 rounded-r-md text-sm text-muted-foreground font-medium select-none">
                                        @{AUTH_POLICY.allowedEmailDomain}
                                    </div>
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Official university domain is fixed.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Specific Verification */}
                    {step === 3 && (
                        <div className="space-y-6 py-4">
                            {role === AUTH_POLICY.roles.student ? (
                                <div className="space-y-3">
                                    <Label htmlFor="studentId">Student ID / Enrollment Number</Label>
                                    <Input
                                        id="studentId"
                                        name="studentId"
                                        placeholder="e.g. 2023CSB101"
                                        value={formData.studentId}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        We will verify this ID against our university records.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Label htmlFor="adminCode">Admin Access</Label>
                                    <Input
                                        id="adminCode"
                                        name="adminCode"
                                        placeholder="Account is created by super admin"
                                        value={formData.adminCode}
                                        onChange={handleChange}
                                        disabled
                                    />
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Admin and department users must be provisioned by an existing admin.
                                    </p>
                                </div>
                            )}

                            <div className="bg-primary/5 p-4 rounded-md border border-primary/20 flex gap-3 items-start">
                                <div className="mt-1 bg-primary/10 p-1 rounded-full">
                                    <Check className="w-4 h-4 text-primary" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-foreground">Terms & Conditions</p>
                                    <p className="text-muted-foreground">By creating an account, you agree to the university's code of conduct and privacy policy.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>
            <CardFooter className="flex justify-between">
                {step > 1 ? (
                    <Button variant="outline" onClick={handleBack}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                ) : (
                    <div /> // Spacer
                )}

                {step < 3 ? (
                    <Button onClick={handleNext}>
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading || !AUTH_POLICY.allowPublicSignup} className="w-32">
                        {loading ? "Creating..." : "Register"}
                    </Button>
                )}
            </CardFooter>

            <div className="p-6 pt-0 text-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </Card>
    )
}
