"use client"

import { useState, useMemo, useEffect } from "react"
import { useComplaints } from "@/context/ComplaintContext"
import { useAuth } from "@/context/AuthContext"
import { ForumThreadCard } from "@/components/forum/ForumThreadCard"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Search, Flame, Clock, TrendingUp, BarChart2, BookOpen, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
    { value: "all", label: "All Issues" },
    { value: "electrical", label: "⚡ Electrical" },
    { value: "plumbing", label: "🔧 Plumbing" },
    { value: "infrastructure", label: "🏗️ Infrastructure" },
    { value: "sanitation", label: "🧹 Sanitation" },
    { value: "it", label: "💻 IT / Network" },
    { value: "other", label: "📌 Other" },
]

export default function DepartmentForum() {
    const { complaints, loading } = useComplaints()
    const { userData } = useAuth()
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("hot")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [showOnlyMine, setShowOnlyMine] = useState(false)
    const [dept, setDept] = useState("")

    useEffect(() => {
        const saved = localStorage.getItem("raiseit_dept")
        if (saved) setDept(saved)
    }, [])

    const filteredComplaints = useMemo(() => {
        return complaints
            .filter(c => {
                const q = searchTerm.toLowerCase()
                const matchesSearch = !q ||
                    c.title?.toLowerCase().includes(q) ||
                    c.description?.toLowerCase().includes(q)
                const matchesCategory = categoryFilter === "all" || c.category === categoryFilter
                const matchesDept = !showOnlyMine || c.taggedAuthority === dept
                return matchesSearch && matchesCategory && matchesDept
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
    }, [complaints, searchTerm, sortBy, categoryFilter, showOnlyMine, dept])

    const stats = useMemo(() => ({
        total: complaints.length,
        resolved: complaints.filter(c => c.status === "Resolved" || c.status === "resolved").length,
        pending: complaints.filter(c => c.status === "Pending" || c.status === "pending").length,
        mine: complaints.filter(c => c.taggedAuthority === dept).length,
    }), [complaints, dept])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 italic text-muted-foreground">
                Loading community feed...
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Community Forum</h1>
                    <p className="text-muted-foreground">
                        Browse all campus complaints. Filter to see issues assigned to your department.
                    </p>
                </div>
                <button
                    onClick={() => setShowOnlyMine(!showOnlyMine)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${showOnlyMine
                        ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/20"
                        : "bg-muted text-muted-foreground border hover:border-violet-400 hover:text-violet-600"
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    {showOnlyMine ? "My Dept Only" : "Show All"}
                </button>
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
                    <Card className="overflow-hidden border-violet-100">
                        <CardHeader className="bg-violet-50 py-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-violet-600" />
                                {userData?.department || "Department"} Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="p-3 bg-violet-50 rounded-xl text-center">
                                <p className="text-xl font-bold text-violet-600">{stats.mine}</p>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Assigned to Dept</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-green-50 rounded-xl text-center">
                                    <p className="text-xl font-bold text-green-600">{stats.resolved}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Solved</p>
                                </div>
                                <div className="p-3 bg-amber-50 rounded-xl text-center">
                                    <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 shadow-sm">
                        <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-violet-500" /> Department Note
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Use the &quot;My Dept Only&quot; toggle to filter complaints assigned to your department. You can view and resolve them from here or the Dashboard.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
