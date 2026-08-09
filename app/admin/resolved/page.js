"use client"

import { DashboardShell } from "@/components/layout/DashboardShell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useComplaints } from "@/context/ComplaintContext"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Tag, User } from "lucide-react"

export default function ResolvedRecentlyPage() {
    const { complaints, loading } = useComplaints()

    if (loading) {
        return (
            <DashboardShell role="admin">
                <div className="flex items-center justify-center h-64 italic text-muted-foreground">Loading resolved data...</div>
            </DashboardShell>
        )
    }

    const resolvedComplaints = complaints
        .filter(c => c.status === "Resolved" || c.status === "resolved")
        .sort((a, b) => new Date(b.resolvedAt || b.createdAt) - new Date(a.resolvedAt || a.createdAt))

    return (
        <DashboardShell role="admin">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Resolved Recently</h2>
                        <p className="text-muted-foreground">History of completed resolutions and closed issues.</p>
                    </div>
                </div>

                {/* Resolved List */}
                <div className="space-y-4">
                    {resolvedComplaints.length > 0 ? (
                        resolvedComplaints.map(complaint => (
                            <Card key={complaint.id} className="overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow group">
                                <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{complaint.title}</h4>
                                            <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Resolved</Badge>
                                            <Badge variant="outline" className="capitalize select-none">{complaint.category || 'General'}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-2 gap-x-4 mt-3 text-xs text-muted-foreground font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Resolved: {new Date(complaint.resolvedAt || complaint.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5" />
                                                <span>Reported by: {complaint.userName || "Anonymous"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Tag className="w-3.5 h-3.5" />
                                                <span>{complaint.taggedAuthority || "General Authority"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 self-end sm:self-center">
                                        <a 
                                            href={`/admin/issues/${complaint.id}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                        >
                                            View Resolution Thread →
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/10">
                            <CheckCircle className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-muted-foreground font-medium">No resolved issues found yet.</p>
                            <p className="text-xs text-muted-foreground mt-1">Resolved issues will appear here once they're marked as solved.</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardShell>
    )
}
