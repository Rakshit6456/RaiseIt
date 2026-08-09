"use client"

import { useAuth } from "@/context/AuthContext"
import { useComplaints } from "@/context/ComplaintContext"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
    LayoutDashboard, 
    MessageSquare, 
    Clock, 
    CheckCircle2, 
    ArrowRight, 
    PlusCircle,
    TrendingUp,
    FileText
} from "lucide-react"

export default function StudentDashboard() {
    const { currentUser, userData, isGuest } = useAuth()
    const { complaints, loading } = useComplaints()

    // Filter complaints reported by this user
    const myComplaints = complaints.filter(c => c.userId === currentUser?.uid)
    const resolvedCount = myComplaints.filter(c => c.status === "Resolved" || c.status === "resolved").length
    const pendingCount = myComplaints.length - resolvedCount

    const recentIssues = myComplaints.slice(0, 3)

    return (
        <DashboardShell role="student">
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userData?.name || "Student"}!</h1>
                        <p className="text-muted-foreground mt-1">Here's an overview of your campus activity and reports.</p>
                    </div>
                    <Button asChild className="rounded-full shadow-lg hover:shadow-primary/20 transition-all">
                        <Link href="/student/report">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Report New Issue
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500/10 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reported</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{myComplaints.length}</div>
                            <p className="text-xs text-muted-foreground mt-1">Issues submitted by you</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Action</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Currently being reviewed</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-gradient-to-br from-green-500/10 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{resolvedCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Successfully fixed</p>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Forum Impact</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-600">
                                {myComplaints.reduce((acc, c) => acc + (c.upvotes?.length || 0), 0)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Total upvotes received</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Recent Issues List */}
                    <Card className="lg:col-span-2 overflow-hidden border-muted/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between bg-muted/20 py-4">
                            <div>
                                <CardTitle className="text-lg">My Recent Reports</CardTitle>
                                <CardDescription>The latest issues you've flagged on campus.</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                                <Link href="/student/track" className="flex items-center gap-1">
                                    View All <ArrowRight className="h-3 w-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentIssues.length > 0 ? (
                                <div className="divide-y divide-muted/40">
                                    {recentIssues.map((issue) => (
                                        <Link 
                                            key={issue.id} 
                                            href={`/forum/${issue.id}`}
                                            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{issue.title}</p>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(issue.createdAt).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1 capitalize">📁 {issue.category}</span>
                                                </div>
                                            </div>
                                            <Badge variant={issue.status === 'Resolved' || issue.status === 'resolved' ? 'success' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider">
                                                {issue.status}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                        <FileText className="w-6 h-6 text-muted-foreground/60" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No issues reported yet.</p>
                                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Reporting issues helps maintain a better campus for everyone.</p>
                                    <Button size="sm" variant="outline" className="mt-4 rounded-full" asChild>
                                        <Link href="/student/report">Report Now</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Community & Tips Sidebar */}
                    <div className="space-y-6">
                        <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                            <CardHeader className="pb-2 relative">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5" /> Trending in Forum
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4 relative">
                                <p className="text-sm text-primary-foreground/80 mb-4">
                                    Stay updated with what other students are reporting and support their cause.
                                </p>
                                <Button variant="secondary" className="w-full font-bold shadow-sm" asChild>
                                    <Link href="/student/forum">Enter Community Forum</Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="border-muted/40 shadow-sm border-2 border-dashed bg-muted/10">
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    💡 Pro-Tip
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Always include a clear photo and precise location when reporting. This helps authorities resolve the issue up to <span className="text-foreground font-bold">2x faster</span>.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
