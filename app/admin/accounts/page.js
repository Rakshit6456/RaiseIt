"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, ShieldPlus, Building2, UserCircle, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { AUTH_POLICY } from "@/lib/auth-policy"
import { createUserByAdmin } from "@/actions/users"

export default function AdminAccountsPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setLocalError] = useState("")
    const [lastCreated, setLastCreated] = useState(null)
    
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "student",
        studentId: "",
        department: ""
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleRoleChange = (value) => {
        setFormData(prev => ({ ...prev, role: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
            const result = await createUserByAdmin({
                ...formData,
                email: formData.email.includes("@") ? formData.email : `${formData.email}@${AUTH_POLICY.allowedEmailDomain}`
            })
            
            setSuccess(true)
            setLocalError("")
            setLastCreated({
                email: result.email,
                password: formData.password,
                role: result.role
            })

            // Reset part of form
            setFormData(prev => ({
                ...prev,
                name: "",
                email: "",
                password: "",
                studentId: "",
                department: ""
            }))
        } catch (error) {
            console.error(error)
            setLocalError(error.message || "Something went wrong while creating the user.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <DashboardShell role="admin">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Account Management</h1>
                    <p className="text-muted-foreground mt-1">Create and provision new accounts for the RaiseIt platform.</p>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Main Form */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                Create New Account
                            </CardTitle>
                            <CardDescription>
                                Fill in the details below to create a new user with specific role access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <Label>Account Role</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleRoleChange("student")}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${formData.role === "student"
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-muted hover:border-muted-foreground/50 text-muted-foreground"
                                            }`}
                                        >
                                            <div className="p-2 bg-background rounded-lg shadow-sm">
                                                <UserCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Student</p>
                                                <p className="text-[10px] opacity-70">Submit complaints & vote</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleRoleChange("department")}
                                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${formData.role === "department"
                                                ? "border-primary bg-primary/5 text-primary"
                                                : "border-muted hover:border-muted-foreground/50 text-muted-foreground"
                                            }`}
                                        >
                                            <div className="p-2 bg-background rounded-lg shadow-sm">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">Department</p>
                                                <p className="text-[10px] opacity-70">Resolve issues & update status</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Enter user's name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email / User ID</Label>
                                        <div className="flex rounded-md shadow-sm">
                                            <Input
                                                id="email"
                                                name="email"
                                                placeholder="username"
                                                className="rounded-r-none focus-visible:ring-0"
                                                value={formData.email.split("@")[0]}
                                                onChange={(e) => {
                                                    const val = e.target.value.split("@")[0]
                                                    setFormData(prev => ({ ...prev, email: val }))
                                                }}
                                                required
                                            />
                                            <div className="bg-muted px-3 flex items-center border border-l-0 rounded-r-md text-xs text-muted-foreground font-medium">
                                                @{AUTH_POLICY.allowedEmailDomain}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Initial Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">The user will use this password for their first login.</p>
                                </div>

                                {formData.role === "student" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="studentId">Student ID / Enrollment No.</Label>
                                        <Input
                                            id="studentId"
                                            name="studentId"
                                            placeholder="e.g. 210101001"
                                            value={formData.studentId}
                                            onChange={handleChange}
                                            required={formData.role === "student"}
                                        />
                                    </div>
                                )}

                                {formData.role === "department" && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="department">Department Name</Label>
                                        <Select 
                                            value={formData.department} 
                                            onValueChange={(val) => setFormData(p => ({...p, department: val}))}
                                            required={formData.role === "department"}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Electrical Department">Electrical Department</SelectItem>
                                                <SelectItem value="Plumbing Department">Plumbing Department</SelectItem>
                                                <SelectItem value="IT Department">IT Department</SelectItem>
                                                <SelectItem value="Infrastructure Team">Infrastructure Team</SelectItem>
                                                <SelectItem value="Sanitation Team">Sanitation Team</SelectItem>
                                                <SelectItem value="Security Office">Security Office</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldPlus className="w-4 h-4 mr-2" />
                                            Create Account
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Quick Help & Last Created */}
                    <div className="lg:col-span-2 space-y-6">
                        {success && lastCreated && (
                            <Card className="border-green-200 bg-green-50/30 overflow-hidden">
                                <div className="h-1 bg-green-500" />
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <CardTitle className="text-lg">Last Created User</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-6">
                                    <div className="p-3 bg-white rounded-lg border border-green-100 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Email:</span>
                                            <span className="font-mono font-bold">{lastCreated.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Password:</span>
                                            <span className="font-mono font-bold">{lastCreated.password}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Role:</span>
                                            <span className="capitalize font-bold text-primary">{lastCreated.role}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-green-700 font-medium">Capture these credentials to share with the user.</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    Administrative Guidelines
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">1</div>
                                    <p>Accounts created here are immediately active and can be used to log in from the main portal.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">2</div>
                                    <p>Ensure email addresses are correct as they serve as the unique identifier for the user.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">3</div>
                                    <p>Passwords must be shared securely with the users after creation.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
