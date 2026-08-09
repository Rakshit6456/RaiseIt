"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { AdminDashboardStats } from "@/components/dashboard/AdminDashboardStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useComplaints } from "@/context/ComplaintContext"
import { resolveComplaint } from "@/actions/complaints"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, Search } from "lucide-react"

export default function AdminDashboard() {
    const { complaints, loading, refreshComplaints } = useComplaints()
    const [actionLoading, setActionLoading] = useState(null)

    if (loading) {
        return (
            <DashboardShell role="admin">
                <div className="flex items-center justify-center h-64 italic text-muted-foreground">Loading authority data...</div>
            </DashboardShell>
        )
    }

    const handleResolve = async (id) => {
        setActionLoading(id)
        try {
            const result = await resolveComplaint(id)
            if (result.success) {
                // Success UI will update through refreshed data
                if (refreshComplaints) refreshComplaints()
            } else {
                console.error(result.message)
            }
        } catch (error) {
            console.error("An unexpected error occurred", error)
        } finally {
            setActionLoading(null)
        }
    }

    const pendingComplaints = complaints.filter(c => c.status === "Pending" || c.status === "pending")
    const resolvedComplaints = complaints.filter(c => c.status === "Resolved" || c.status === "resolved")

    return (
        <DashboardShell role="admin">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Authority Management</h2>
                        <p className="text-muted-foreground">Monitor and resolve reported campus infrastructure issues.</p>
                    </div>
                </div>

                {/* Stats */}
                <AdminDashboardStats complaints={complaints} />

                {/* Issues List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Pending Issues ({pendingComplaints.length})
                        </h3>
                    </div>

                    <div className="grid gap-4">
                        {pendingComplaints.length > 0 ? (
                            pendingComplaints.map(complaint => (
                                <Card key={complaint.id} className="overflow-hidden border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg">{complaint.title}</h4>
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                                                {complaint.category && <Badge variant="secondary" className="capitalize">{complaint.category}</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground font-medium">
                                                <span className="flex items-center gap-1">📍 {typeof complaint.location === 'object' ? `${complaint.location.building || ''} ${complaint.location.room || ''}` : complaint.location || "Main Campus"}</span>
                                                <span className="flex items-center gap-1">👤 {complaint.userName || "Anonymous"}</span>
                                                <span className="flex items-center gap-1">📅 {new Date(complaint.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                asChild
                                            >
                                                <a href={`/admin/issues/${complaint.id}`} target="_blank" rel="noopener noreferrer">View Thread</a>
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                onClick={() => handleResolve(complaint.id)}
                                                disabled={actionLoading === complaint.id}
                                            >
                                                {actionLoading === complaint.id ? "Resolving..." : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" /> Mark as Solved
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-20" />
                                <p className="text-muted-foreground">All issues are currently resolved! 🎉</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resolved Recently */}
                {resolvedComplaints.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 opacity-70">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            Recently Resolved
                        </h3>
                        <div className="grid gap-2 opacity-70">
                            {resolvedComplaints.slice(0, 5).map(complaint => (
                                <div key={complaint.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 text-sm">
                                    <span className="font-medium">{complaint.title}</span>
                                    <span className="text-xs text-muted-foreground">Resolved on {new Date(complaint.resolvedAt || complaint.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardShell>
    )
}

