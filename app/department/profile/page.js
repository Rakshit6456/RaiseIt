"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { useComplaints } from "@/context/ComplaintContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Building2,
    CheckCircle,
    Clock,
    TrendingUp,
    ArrowRight,
    BarChart3,
    Inbox,
    XCircle,
    Award,
    Loader2
} from "lucide-react"

// --- Simple SVG Bar Chart ---
function BarChart({ data, maxVal, colorClass = "fill-violet-500" }) {
    if (!data || data.length === 0) return null
    const BAR_H = 120
    const BAR_W = 28
    const GAP = 10
    const chartWidth = data.length * (BAR_W + GAP)

    return (
        <svg
            width="100%"
            viewBox={`0 0 ${chartWidth} ${BAR_H + 24}`}
            className="overflow-visible"
            preserveAspectRatio="xMidYMid meet"
        >
            {data.map((item, i) => {
                const barHeight = maxVal > 0 ? (item.value / maxVal) * BAR_H : 0
                const x = i * (BAR_W + GAP)
                const y = BAR_H - barHeight
                return (
                    <g key={i}>
                        {/* Background track */}
                        <rect
                            x={x}
                            y={0}
                            width={BAR_W}
                            height={BAR_H}
                            rx={6}
                            className="fill-muted/40"
                        />
                        {/* Bar */}
                        <rect
                            x={x}
                            y={y}
                            width={BAR_W}
                            height={barHeight}
                            rx={6}
                            className={colorClass}
                        />
                        {/* Value label */}
                        {item.value > 0 && (
                            <text
                                x={x + BAR_W / 2}
                                y={y - 4}
                                textAnchor="middle"
                                className="fill-foreground text-[10px] font-bold"
                                fontSize={10}
                            >
                                {item.value}
                            </text>
                        )}
                        {/* X label */}
                        <text
                            x={x + BAR_W / 2}
                            y={BAR_H + 16}
                            textAnchor="middle"
                            className="fill-muted-foreground"
                            fontSize={9}
                        >
                            {item.label}
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

// --- Donut Chart for status breakdown ---
function DonutChart({ segments }) {
    const SIZE = 120
    const R = 40
    const CX = SIZE / 2
    const CY = SIZE / 2
    const circumference = 2 * Math.PI * R

    const total = segments.reduce((sum, s) => sum + s.value, 0)
    let cumulative = 0

    const arcs = segments.map((seg) => {
        const fraction = total > 0 ? seg.value / total : 0
        const strokeDash = fraction * circumference
        const strokeOffset = circumference - cumulative * circumference / (total || 1) - fraction * circumference / 1
        const offset = total > 0 ? -(cumulative / total) * circumference : 0
        const result = { ...seg, strokeDash, offset: -(cumulative / (total || 1)) * circumference, fraction }
        cumulative += seg.value
        return result
    })

    return (
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--muted)" strokeWidth={18} />
            {arcs.map((arc, i) => (
                arc.fraction > 0 && (
                    <circle
                        key={i}
                        cx={CX}
                        cy={CY}
                        r={R}
                        fill="none"
                        stroke={arc.color}
                        strokeWidth={18}
                        strokeDasharray={`${arc.fraction * circumference} ${circumference}`}
                        strokeDashoffset={arc.offset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${CX} ${CY})`}
                    />
                )
            ))}
            <text x={CX} y={CY + 4} textAnchor="middle" fontSize={14} fontWeight="bold" fill="currentColor">
                {total}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize={7} fill="gray">
                total
            </text>
        </svg>
    )
}

function getMonthLabel(date) {
    return date.toLocaleString("default", { month: "short" })
}

export default function DepartmentProfilePage() {
    const { userData, currentUser } = useAuth()
    const { complaints, loading } = useComplaints()
    const [dept, setDept] = useState("")

    // Read from localStorage (same as dashboard)
    useEffect(() => {
        const saved = localStorage.getItem("raiseit_dept")
        if (saved) setDept(saved)
    }, [])

    // Filter complaints tagged to this department
    const myComplaints = useMemo(() =>
        complaints.filter(c => dept && c.taggedAuthority === dept),
        [complaints, dept]
    )

    const resolved = myComplaints.filter(c => c.status === "Resolved" || c.status === "resolved")
    const pending = myComplaints.filter(c => c.status === "Pending" || c.status === "pending")
    const inProgress = myComplaints.filter(c => c.status === "In Progress")
    const rejected = myComplaints.filter(c => c.status === "Rejected" || c.status === "rejected")

    const resolutionRate = myComplaints.length > 0
        ? Math.round((resolved.length / myComplaints.length) * 100)
        : 0

    // Monthly complaint chart — last 6 months
    const monthlyData = useMemo(() => {
        const now = new Date()
        const months = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const label = getMonthLabel(d)
            const year = d.getFullYear()
            const month = d.getMonth()
            const total = myComplaints.filter(c => {
                const cd = new Date(c.createdAt)
                return cd.getFullYear() === year && cd.getMonth() === month
            }).length
            const res = resolved.filter(c => {
                const cd = new Date(c.createdAt)
                return cd.getFullYear() === year && cd.getMonth() === month
            }).length
            months.push({ label, total, res })
        }
        return months
    }, [myComplaints, resolved])

    const maxMonthlyTotal = Math.max(...monthlyData.map(m => m.total), 1)
    const maxMonthlyRes = Math.max(...monthlyData.map(m => m.res), 1)

    const donutSegments = [
        { label: "Resolved", value: resolved.length, color: "#22c55e" },
        { label: "In Progress", value: inProgress.length, color: "#3b82f6" },
        { label: "Pending", value: pending.length, color: "#f59e0b" },
        { label: "Rejected", value: rejected.length, color: "#ef4444" },
    ]

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground italic">Loading performance data...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Department Profile</h1>
                    <p className="text-muted-foreground mt-1">Performance overview and complaint analytics for your department.</p>
                </div>
                <Button asChild className="rounded-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20">
                    <Link href="/department/dashboard">
                        View Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                </Button>
            </div>

            {/* Department Identity Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white p-8">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Department Account</p>
                        <h2 className="text-2xl font-bold">{dept || "Department"}</h2>
                        <p className="text-white/70 text-sm">{currentUser?.email}</p>
                    </div>
                    <div className="sm:ml-auto flex flex-col items-start sm:items-end gap-1">
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/10">
                            <p className="text-2xl font-bold">{resolutionRate}%</p>
                            <p className="text-xs text-white/70">Resolution Rate</p>
                        </div>
                        {resolutionRate >= 80 && (
                            <span className="flex items-center gap-1 text-xs bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-full border border-yellow-300/30 font-medium">
                                <Award className="w-3 h-3" /> High Performer
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <Inbox className="w-4 h-4" /> Total Assigned
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{myComplaints.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-green-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Resolved
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{resolved.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">{resolutionRate}% resolution rate</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-500" /> Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">{pending.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-red-500/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-red-500" /> Rejected
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{rejected.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Marked invalid</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Monthly Volume Chart */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <CardHeader className="bg-muted/20 pb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-violet-600" />
                            <div>
                                <CardTitle className="text-base">Monthly Complaints Received</CardTitle>
                                <CardDescription>Last 6 months — total assigned to your department</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 pb-4 px-6">
                        {myComplaints.length > 0 ? (
                            <BarChart
                                data={monthlyData.map(m => ({ label: m.label, value: m.total }))}
                                maxVal={maxMonthlyTotal}
                                colorClass="fill-violet-500"
                            />
                        ) : (
                            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                                No data available yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Donut */}
                <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/20 pb-4">
                        <CardTitle className="text-base">Status Breakdown</CardTitle>
                        <CardDescription>Distribution by current status</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 flex flex-col items-center gap-4">
                        <DonutChart segments={donutSegments} />
                        <div className="w-full space-y-2">
                            {donutSegments.map((seg) => (
                                <div key={seg.label} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                                        <span className="text-muted-foreground">{seg.label}</span>
                                    </div>
                                    <span className="font-bold">{seg.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Resolution Trend */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/20 pb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <div>
                            <CardTitle className="text-base">Monthly Resolutions</CardTitle>
                            <CardDescription>Complaints resolved each month over the last 6 months</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 pb-4 px-6">
                    {resolved.length > 0 ? (
                        <BarChart
                            data={monthlyData.map(m => ({ label: m.label, value: m.res }))}
                            maxVal={maxMonthlyRes}
                            colorClass="fill-green-500"
                        />
                    ) : (
                        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                            No resolutions recorded yet
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Resolved */}
            {resolved.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Recently Resolved Complaints
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-muted/40">
                            {resolved.slice(0, 8).map((complaint) => (
                                <Link
                                    key={complaint.id}
                                    href={`/department/issues/${complaint.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="space-y-0.5">
                                        <p className="font-medium text-sm line-through text-muted-foreground group-hover:text-foreground transition-colors">
                                            {complaint.title}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>📍 {complaint.location?.building || "Campus"}</span>
                                            <span>📅 {new Date(complaint.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 shrink-0">
                                        ✅ Resolved
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
