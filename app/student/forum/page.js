"use client"

import { useState, useMemo } from "react"
import { useComplaints } from "@/context/ComplaintContext"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { ForumThreadCard } from "@/components/forum/ForumThreadCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Search, Flame, Clock, TrendingUp, PlusCircle, BarChart2, BookOpen } from "lucide-react"

const CATEGORIES = [
    { value: "all", label: "All Issues" },
    { value: "electrical", label: "⚡ Electrical" },
    { value: "plumbing", label: "🔧 Plumbing" },
    { value: "infrastructure", label: "🏗️ Infrastructure" },
    { value: "sanitation", label: "🧹 Sanitation" },
    { value: "it", label: "💻 IT / Network" },
    { value: "other", label: "📌 Other" },
]

export default function StudentForum() {
    const { complaints, loading } = useComplaints()
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("hot")
    const [categoryFilter, setCategoryFilter] = useState("all")

    const filteredComplaints = useMemo(() => {
        return complaints
            .filter(c => {
                const q = searchTerm.toLowerCase()
                const matchesSearch = !q ||
                    c.title?.toLowerCase().includes(q) ||
                    c.description?.toLowerCase().includes(q)
                const matchesCategory = categoryFilter === "all" || c.category === categoryFilter
                return matchesSearch && matchesCategory
            })
            .sort((a, b) => {
                if (sortBy === "hot") {
                    const score = c => (c.upvotes?.length || 0) * 2 + (c.comments?.length || 0)
                    return score(b) - score(a)
                }
                if (sortBy === "new") return new Date(b.createdAt) - new Date(a.createdAt)
                if (sortBy === "top") return (b.upvotes?.length || 0) - (a.upvotes?.length || 0)
                return 0
            })
    }, [complaints, searchTerm, sortBy, categoryFilter])

    const stats = useMemo(() => ({
        total: complaints.length,
        resolved: complaints.filter(c => c.status === "Resolved" || c.status === "resolved").length,
        pending: complaints.filter(c => c.status === "Pending" || c.status === "pending").length,
    }), [complaints])

    if (loading) {
        return (
            <DashboardShell role="student">
                <div className="flex items-center justify-center h-64 italic text-muted-foreground">Loading community feed...</div>
            </DashboardShell>
        )
    }

    return (
        <DashboardShell role="student">
            <div className="flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
                        <p className="text-muted-foreground">
                            Common dashboard for all complaints. Support issues that matter to you.
                        </p>
                    </div>
                    <Button asChild className="shrink-0 rounded-full shadow-lg">
                        <Link href="/student/report">
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Report Issue
                        </Link>
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Feed */}
                    <div className="flex-1 space-y-4">
                        {/* Filters & Search */}
                        <div className="flex flex-col sm:flex-row gap-3 items-center bg-muted/30 p-3 rounded-xl border">
                            <div className="flex bg-background border rounded-lg p-1 shrink-0">
                                {[
                                    { id: "hot", label: "Hot", icon: Flame },
                                    { id: "new", label: "New", icon: Clock },
                                    { id: "top", label: "Top", icon: TrendingUp },
                                ].map(({ id, label, icon: Icon }) => (
                                    <Button
                                        key={id}
                                        variant={sortBy === id ? "secondary" : "ghost"}
                                        size="sm"
                                        onClick={() => setSortBy(id)}
                                        className="h-8 gap-1.5 text-xs px-3"
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {label}
                                    </Button>
                                ))}
                            </div>
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    placeholder="Search issues..."
                                    className="w-full pl-8 pr-4 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Category Pills */}
                        <div className="flex gap-2 flex-wrap">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => setCategoryFilter(cat.value)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all
                                        ${categoryFilter === cat.value
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Thread List */}
                        <div className="space-y-3">
                            {filteredComplaints.length > 0 ? (
                                filteredComplaints.map(complaint => (
                                    <ForumThreadCard key={complaint.id} complaint={complaint} />
                                ))
                            ) : (
                                <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-muted/10">
                                    <p className="text-muted-foreground">No complaints found matching your filters.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="w-full lg:w-80 space-y-4">
                        <Card className="overflow-hidden border-primary/10">
                            <CardHeader className="bg-primary/5 py-4">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <BarChart2 className="w-4 h-4 text-primary" /> Campus Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-muted/40 rounded-xl text-center">
                                    <p className="text-xl font-bold">{stats.total}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Issues</p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-xl text-center">
                                    <p className="text-xl font-bold text-green-600">{stats.resolved}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold font-green-600">Solved</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl text-center col-span-2">
                                    <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-amber-600 font-bold">Awaiting Action</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-sm">
                            <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" /> Community Note
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                This is a discussion-based forum. Support other students by upvoting their issues to bring them to the authority's attention faster.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}

