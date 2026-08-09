"use client"

import { useState, useEffect } from "react"
import { useComplaints } from "@/context/ComplaintContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    Clock,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Building2,
    Loader2,
    InboxIcon,
    ChevronDown
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const DEPARTMENTS = [
    "Electrical Department",
    "Plumbing Department",
    "IT Department",
    "Hostel Warden",
    "Infrastructure Team",
    "Sanitation Team",
    "Security Office",
    "Library Administration",
    "Head of Department",
    "College Principal",
]

function timeAgo(date) {
    if (!date) return "Recently"
    const now = new Date()
    const then = new Date(date)
    const diff = now - then
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
}

const STATUS_BADGE = {
    "Pending":     "bg-amber-100 text-amber-700 border-amber-200",
    "pending":     "bg-amber-100 text-amber-700 border-amber-200",
    "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
    "Resolved":    "bg-green-100 text-green-700 border-green-200",
    "resolved":    "bg-green-100 text-green-700 border-green-200",
    "Rejected":    "bg-red-100 text-red-700 border-red-200",
}

export default function DepartmentDashboard() {
    const { complaints, loading, updateStatus } = useComplaints()
    const [resolvingId, setResolvingId] = useState(null)
    const [dept, setDept] = useState("")

    // Persist selected department across page reloads
    useEffect(() => {
        const saved = localStorage.getItem("raiseit_dept")
        if (saved) setDept(saved)
    }, [])

    const handleDeptChange = (val) => {
        setDept(val)
        localStorage.setItem("raiseit_dept", val)
    }

    // Filter complaints tagged to selected department
    const myComplaints = dept
        ? complaints.filter(c => c.taggedAuthority === dept)
        : []

    const pending    = myComplaints.filter(c => c.status === "Pending" || c.status === "pending")
    const inProgress = myComplaints.filter(c => c.status === "In Progress")
    const resolved   = myComplaints.filter(c => c.status === "Resolved" || c.status === "resolved")

    const handleQuickResolve = async (complaintId) => {
        setResolvingId(complaintId)
        try {
            await updateStatus(complaintId, "Resolved", `Resolved by ${dept}`)
        } catch (err) {
            console.error("Error resolving:", err)
        } finally {
            setResolvingId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground italic">Loading department data...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">

            {/* Header + Department Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-violet-600" />
                        </div>
                        {dept ? (
                            <span className="text-sm font-semibold text-violet-600 bg-violet-50 px-3 py-0.5 rounded-full border border-violet-200">
                                {dept}
                            </span>
                        ) : (
                            <span className="text-sm text-muted-foreground italic">No department selected</span>
                        )}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Department Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Complaints assigned to your department — resolve and track them here.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Department Selector */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-0.5">
                            Viewing as
                        </label>
                        <Select value={dept} onValueChange={handleDeptChange}>
                            <SelectTrigger className="w-52 bg-violet-50 border-violet-200 text-violet-700 font-medium focus:ring-violet-300">
                                <Building2 className="w-4 h-4 mr-2 shrink-0" />
                                <SelectValue placeholder="Select department..." />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPARTMENTS.map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button asChild className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 self-end">
                        <Link href="/department/profile">
                            Performance <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* No department selected prompt */}
            {!dept && (
                <div className="text-center py-20 border-2 border-dashed border-violet-200 rounded-2xl bg-violet-50/30">
                    <Building2 className="w-16 h-16 text-violet-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-violet-700">Select Your Department</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                        Use the dropdown above to choose your department and view assigned complaints.
                    </p>
                </div>
            )}

            {dept && (
                <>
                    {/* Stats */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-transparent">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Assigned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{myComplaints.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">All time complaints</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-600">{pending.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600">{inProgress.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Currently being worked on</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-green-500/10 to-transparent">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600">{resolved.length}</div>
                                <p className="text-xs text-muted-foreground mt-1">Successfully closed</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Complaints */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Pending Complaints ({pending.length})
                        </h2>

                        {pending.length === 0 ? (
                            <div className="text-center py-14 border-2 border-dashed rounded-xl bg-muted/10">
                                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-40" />
                                <p className="text-muted-foreground font-medium">All caught up! No pending complaints.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {pending.map(complaint => (
                                    <Card key={complaint.id} className="overflow-hidden border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                                        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-base truncate">{complaint.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[complaint.status] || STATUS_BADGE["Pending"]}`}>
                                                        {complaint.status}
                                                    </span>
                                                    {complaint.category && (
                                                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground capitalize border">
                                                            {complaint.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                                                    <span>📍 {complaint.location?.building || "Campus"}{complaint.location?.room ? `, Room ${complaint.location.room}` : ""}</span>
                                                    <span>👤 {complaint.anonymous ? "Anonymous" : (complaint.userEmail?.split("@")[0] || "Student")}</span>
                                                    <span>🕐 {timeAgo(complaint.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/department/issues/${complaint.id}`}>
                                                        View Thread
                                                    </Link>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleQuickResolve(complaint.id)}
                                                    disabled={resolvingId === complaint.id}
                                                >
                                                    {resolvingId === complaint.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4 mr-1.5" />
                                                            Mark Solved
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* In Progress */}
                    {inProgress.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-blue-500" />
                                In Progress ({inProgress.length})
                            </h2>
                            <div className="grid gap-3">
                                {inProgress.map(complaint => (
                                    <div key={complaint.id} className="flex items-center justify-between p-4 rounded-xl border bg-blue-50/40 hover:bg-blue-50/60 transition-colors">
                                        <div className="space-y-0.5">
                                            <p className="font-semibold">{complaint.title}</p>
                                            <p className="text-xs text-muted-foreground">{timeAgo(complaint.createdAt)} · {complaint.location?.building || "Campus"}</p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/department/issues/${complaint.id}`}>Update</Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recently Resolved */}
                    {resolved.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2 opacity-70">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Recently Resolved ({resolved.length})
                            </h2>
                            <div className="grid gap-2 opacity-75">
                                {resolved.slice(0, 5).map(complaint => (
                                    <div key={complaint.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 text-sm">
                                        <span className="font-medium line-through text-muted-foreground">{complaint.title}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state — department selected but no complaints */}
                    {myComplaints.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/10">
                            <InboxIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-muted-foreground">No complaints assigned yet</h3>
                            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                                Complaints tagged to <strong>{dept}</strong> will appear here once students submit them.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
