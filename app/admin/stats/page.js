"use client"

import { DashboardShell } from "@/components/layout/DashboardShell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { CheckCircle2, XCircle, Clock, AlertTriangle, BarChart3 } from "lucide-react"
import { useComplaints } from "@/context/ComplaintContext"
import { useMemo } from "react"

export default function GlobalStatsPage() {
    const { complaints, loading } = useComplaints()

    const stats = useMemo(() => {
        if (!complaints) return {
            totalResolved: 0,
            totalInProgress: 0,
            totalRejected: 0,
            statusDistribution: [],
            categoryData: []
        }

        const totalResolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'resolved').length
        const totalInProgress = complaints.filter(c => ['In Progress', 'Pending', 'Open', 'pending'].includes(c.status)).length
        const totalRejected = complaints.filter(c => c.status === 'Rejected' || c.status === 'rejected').length


        // Status Distribution
        const statusDistribution = [
            { name: "Resolved", value: totalResolved, color: "#22c55e" },
            { name: "In Progress", value: totalInProgress, color: "#f59e0b" },
            { name: "Rejected", value: totalRejected, color: "#ef4444" },
        ].filter(i => i.value > 0)

        // Category Breakdown
        const categories = [...new Set(complaints.map(c => c.category || 'Uncategorized'))]
        const categoryData = categories.map(cat => {
            const catComplaints = complaints.filter(c => (c.category || 'Uncategorized') === cat)
            return {
                name: cat,
                resolved: catComplaints.filter(c => c.status === 'Resolved' || c.status === 'resolved').length,
                unresolved: catComplaints.filter(c => ['In Progress', 'Pending', 'Open', 'pending'].includes(c.status)).length,
                rejected: catComplaints.filter(c => c.status === 'Rejected' || c.status === 'rejected').length
            }
        })

        return {
            totalResolved,
            totalInProgress,
            totalRejected,
            statusDistribution,
            categoryData
        }
    }, [complaints])

    if (loading) {
        return (
            <DashboardShell role="admin">
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-muted-foreground">Loading campus analytics...</p>
                </div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell role="admin">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Global Campus Statistics</h1>
                </div>
                <p className="text-muted-foreground">Transparency in resolution: Real-time metrics for all reported issues.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalResolved}</div>
                        <p className="text-xs text-muted-foreground">Successfully closed</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInProgress}</div>
                        <p className="text-xs text-muted-foreground">Active issues</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRejected}</div>
                        <p className="text-xs text-muted-foreground">Declined or invalid</p>
                    </CardContent>
                </Card>

            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
                {/* Category Breakdown Chart */}
                <Card className="col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Departmental Performance</CardTitle>
                        <CardDescription>Resolution metrics across campus departments</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {stats.categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={stats.categoryData}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="unresolved" name="Unresolved" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No data available for visualization
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Distribution Chart */}
                <Card className="col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Overall Resolution Status</CardTitle>
                        <CardDescription>Current state of all reported community issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.statusDistribution.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={stats.statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No distribution data available
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    )
}
