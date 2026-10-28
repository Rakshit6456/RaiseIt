"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, ShieldPlus, Building2, UserCircle, Loader2, CheckCircle2, AlertCircle, Users, RefreshCw } from "lucide-react"
import { AUTH_POLICY } from "@/lib/auth-policy"
import { generatePassword } from "@/lib/password-policy"
import { createUserByAdmin, listUsersByAdmin } from "@/actions/users"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AdminAccountsPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setLocalError] = useState("")
    const [lastCreated, setLastCreated] = useState(null)

    const [accounts, setAccounts] = useState([])
    const [accountsLoading, setAccountsLoading] = useState(true)
    const [accountsError, setAccountsError] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [search, setSearch] = useState("")

    const loadAccounts = useCallback(async () => {
        setAccountsLoading(true)
        setAccountsError("")
        try {
            setAccounts(await listUsersByAdmin())
        } catch (err) {
            setAccountsError(err.message || "Could not load accounts.")
        } finally {
            setAccountsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadAccounts()
    }, [loadAccounts])

    const visibleAccounts = accounts.filter(a =>
        (roleFilter === "all" || a.role === roleFilter) &&
        (!search.trim() || `${a.name} ${a.email} ${a.studentId || ""} ${a.department || ""}`.toLowerCase().includes(search.trim().toLowerCase()))
    )
    const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Never"
    
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
            loadAccounts()

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
                                    <div className="flex gap-2">
                                        <Input
                                            id="password"
                                            name="password"
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Min 10 chars, upper, lower, number"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setFormData(prev => ({ ...prev, password: generatePassword() }))}
                                        >
                                            Generate
                                        </Button>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Temporary password. The user must replace it with their own at first login.</p>
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
                                                {AUTH_POLICY.departments.map(name => (
                                                    <SelectItem key={name} value={name}>{name}</SelectItem>
                                                ))}
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
                                    <p className="text-xs text-green-700 font-medium">Shown once. Copy it now and share it privately.</p>
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
                                    <p>Accounts created here are active immediately. Users cannot sign themselves up, and must set their own password on first login.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">2</div>
                                    <p>A department account is locked to the department you choose here. It cannot be changed from the app.</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">3</div>
                                    <p>Share the temporary password privately. It is displayed below only until you leave this page.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* All accounts */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    All Accounts
                                    {!accountsLoading && <span className="text-sm font-normal text-muted-foreground">({visibleAccounts.length} of {accounts.length})</span>}
                                </CardTitle>
                                <CardDescription>Every account that exists, including ones created earlier.</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Input
                                    placeholder="Search name, email, ID..."
                                    className="w-52"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All roles</SelectItem>
                                        <SelectItem value="admin">Admins</SelectItem>
                                        <SelectItem value="department">Departments</SelectItem>
                                        <SelectItem value="student">Students</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button type="button" variant="outline" size="icon" onClick={loadAccounts} disabled={accountsLoading} title="Refresh">
                                    <RefreshCw className={`w-4 h-4 ${accountsLoading ? "animate-spin" : ""}`} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {accountsError && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {accountsError}
                            </div>
                        )}
                        {accountsLoading ? (
                            <div className="flex items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading accounts...
                            </div>
                        ) : visibleAccounts.length === 0 ? (
                            <p className="text-center py-10 text-sm text-muted-foreground">No accounts match.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Department / ID</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead>Last sign-in</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleAccounts.map(a => (
                                            <TableRow key={a.uid}>
                                                <TableCell className="font-medium">{a.name || "-"}</TableCell>
                                                <TableCell className="font-mono text-xs">{a.email}</TableCell>
                                                <TableCell><Badge variant="outline" className="capitalize">{a.role || "no profile"}</Badge></TableCell>
                                                <TableCell className="text-sm">{a.department || a.studentId || "-"}</TableCell>
                                                <TableCell>
                                                    {!a.hasProfile ? (
                                                        <Badge variant="destructive">No profile</Badge>
                                                    ) : !a.active ? (
                                                        <Badge variant="secondary">Disabled</Badge>
                                                    ) : a.mustChangePassword ? (
                                                        <Badge variant="secondary">Awaiting first login</Badge>
                                                    ) : (
                                                        <Badge>Active</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">{formatDate(a.createdAt)}</TableCell>
                                                <TableCell className="text-sm whitespace-nowrap">{formatDate(a.lastSignInAt)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
