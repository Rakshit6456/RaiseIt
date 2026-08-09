"use client"

import { useState, useMemo } from "react"
import { useComplaints } from "@/context/ComplaintContext"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { ForumThreadCard } from "@/components/forum/ForumThreadCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Search, Flame, Clock, TrendingUp, PlusCircle, BookOpen, BarChart2, CheckCheck } from "lucide-react"

const CATEGORIES = [
    { value: "all", label: "All Issues" },
    { value: "electrical", label: "⚡ Electrical" },
    { value: "plumbing", label: "🔧 Plumbing" },
    { value: "infrastructure", label: "🏗️ Infrastructure" },
    { value: "sanitation", label: "🧹 Sanitation" },
    { value: "it", label: "💻 IT / Network" },
    { value: "other", label: "📌 Other" },
]

const AUTHORITIES = [
    "all",
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

export default function BrowsePage() {
    const { complaints, loading } = useComplaints()
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("hot")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [authorityFilter, setAuthorityFilter] = useState("all")

    const filteredComplaints = useMemo(() => {
        return complaints
            .filter(c => {
                const q = searchTerm.toLowerCase()
                const matchesSearch = !q ||
                    c.title?.toLowerCase().includes(q) ||
                    c.description?.toLowerCase().includes(q) ||
                    c.taggedAuthority?.toLowerCase().includes(q)
                const matchesCategory = categoryFilter === "all" || c.category === categoryFilter
                const matchesAuthority = authorityFilter === "all" || c.taggedAuthority === authorityFilter
                return matchesSearch && matchesCategory && matchesAuthority
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
    }, [complaints, searchTerm, sortBy, categoryFilter, authorityFilter])

    const stats = useMemo(() => ({
        total: complaints.length,
        resolved: complaints.filter(c => c.status === "Resolved" || c.status === "resolved").length,
        pending: complaints.filter(c => c.status === "Pending" || c.status === "pending").length,
        totalUpvotes: complaints.reduce((sum, c) => sum + (c.upvotes?.length || 0), 0),
    }), [complaints])

    return (
        <DashboardShell role="admin">
            {/* ── Page Header ── */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Flame className="w-6 h-6 text-orange-500" />
                        <h1 className="text-3xl font-bold tracking-tight">Browse Community Forum</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Discover campus issues, support what matters, and follow resolutions.
                    </p>
                </div>
                <Button asChild className="shrink-0 rounded-full px-5 shadow-md">
                    <Link href="/student/report">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Post Issue
                    </Link>
                </Button>
            </div>

            <div className="flex gap-6 items-start">
                {/* ── Main Feed ── */}
                <div className="flex-1 space-y-4 min-w-0">

                    {/* Sort + Search Bar */}
                    <div className="flex items-center gap-3 bg-muted/40 border rounded-xl p-3 flex-wrap">
                        <div className="flex gap-1">
                            {[
                                { id: "hot", label: "Hot", icon: Flame },
                                { id: "new", label: "New", icon: Clock },
                                { id: "top", label: "Top", icon: TrendingUp },
                            ].map(({ id, label, icon: Icon }) => (
                                <Button
                                    key={id}
                                    variant={sortBy === id ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setSortBy(id)}
                                    className="gap-1.5 rounded-lg"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </Button>
                            ))}
                        </div>
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search threads..."
                                className="pl-8 bg-background rounded-lg"
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
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                                    ${categoryFilter === cat.value
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Authority Filter Pills */}
                    {authorityFilter !== "all" && (
                        <div className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                            <span>Filtering by: <strong>@{authorityFilter}</strong></span>
                            <button
                                onClick={() => setAuthorityFilter("all")}
                                className="ml-auto text-xs underline hover:no-underline"
                            >
                                Clear
                            </button>
                        </div>
                    )}

                    {/* Thread List */}
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-28 bg-muted/40 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : filteredComplaints.length > 0 ? (
                        <div className="space-y-3">
                            {filteredComplaints.map(complaint => (
                                <ForumThreadCard key={complaint.id} complaint={complaint} isAdminView={true} />
                            ))}
                            <p className="text-center text-xs text-muted-foreground pt-2">
                                Showing {filteredComplaints.length} of {complaints.length} threads
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-xl space-y-3">
                            <p className="text-2xl">📭</p>
                            <p className="text-muted-foreground font-medium">No threads found.</p>
                            <p className="text-sm text-muted-foreground">Be the first to report a campus issue!</p>
                            <Button asChild className="mt-2 rounded-full">
                                <Link href="/student/report">
                                    <PlusCircle className="w-4 h-4 mr-2" /> Post an Issue
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Right Sidebar ── */}
                <div className="w-72 hidden lg:block space-y-4 shrink-0">

                    {/* Stats Widget */}
                    <div className="border rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3">
                            <h3 className="font-bold text-sm text-primary-foreground flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" /> Forum Stats
                            </h3>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            <div className="text-center bg-muted/50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Total Issues</p>
                            </div>
                            <div className="text-center bg-green-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Resolved</p>
                            </div>
                            <div className="text-center bg-amber-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
                            </div>
                            <div className="text-center bg-blue-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-blue-600">{stats.totalUpvotes}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Total Upvotes</p>
                            </div>
                        </div>
                    </div>

                    {/* About Widget */}
                    <div className="border rounded-xl p-4 space-y-3 bg-gradient-to-br from-orange-50 to-background">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-orange-500" /> About This Forum
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Post campus infrastructure problems, tag the right authority, and let the community upvote what matters most. <strong>More votes = faster resolution.</strong>
                        </p>
                        <Button asChild className="w-full rounded-full" size="sm">
                            <Link href="/student/report">
                                <PlusCircle className="w-3.5 h-3.5 mr-2" /> New Post
                            </Link>
                        </Button>
                    </div>

                    {/* Filter by Authority */}
                    <div className="border rounded-xl p-4 space-y-2.5">
                        <h3 className="font-bold text-sm">🏛️ Filter by Authority</h3>
                        <div className="space-y-1">
                            {AUTHORITIES.map(auth => (
                                <button
                                    key={auth}
                                    onClick={() => setAuthorityFilter(auth)}
                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all
                                        ${authorityFilter === auth
                                            ? "bg-indigo-100 text-indigo-700 font-semibold"
                                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                        }`}
                                >
                                    {auth === "all" ? "All Authorities" : `@${auth}`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rules Widget */}
                    <div className="border rounded-xl p-4 space-y-2">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <CheckCheck className="w-4 h-4 text-primary" /> Forum Rules
                        </h3>
                        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
                            <li>Be specific about location & room number</li>
                            <li>Always tag the correct authority</li>
                            <li>Upload photos for faster resolution</li>
                            <li>Check for duplicates before posting</li>
                            <li>Keep comments constructive</li>
                        </ol>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
