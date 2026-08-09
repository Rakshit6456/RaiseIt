"use client"

import { useState } from "react"
import Link from "next/link"
import { useComplaints } from "@/context/ComplaintContext"
import { useAuth } from "@/context/AuthContext"
import { ArrowUp, MessageSquare, MapPin, Clock, Tag, CheckCircle2, Flame, Copy } from "lucide-react"

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

const CATEGORY_COLORS = {
    electrical: "bg-yellow-100 text-yellow-700 border-yellow-200",
    plumbing: "bg-blue-100 text-blue-700 border-blue-200",
    infrastructure: "bg-orange-100 text-orange-700 border-orange-200",
    sanitation: "bg-emerald-100 text-emerald-700 border-emerald-200",
    it: "bg-purple-100 text-purple-700 border-purple-200",
    other: "bg-gray-100 text-gray-700 border-gray-200",
}

const SEVERITY_COLORS = {
    Low: "bg-slate-100 text-slate-600 border-slate-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Critical: "bg-red-100 text-red-700 border-red-200",
}



export function ForumThreadCard({ complaint, isAdminView }) {
    const { upvoteComplaint, removeUpvote } = useComplaints()
    const { currentUser } = useAuth()
    const [isVoting, setIsVoting] = useState(false)

    const upvotes = complaint.upvotes || []
    const hasVoted = currentUser && upvotes.includes(currentUser.uid)
    const upvoteCount = upvotes.length
    const commentCount = complaint.comments?.length || 0
    const isResolved = complaint.status === "Resolved" || complaint.status === "resolved"

    const handleUpvote = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!currentUser || isVoting) return
        setIsVoting(true)
        try {
            if (hasVoted) {
                await removeUpvote(complaint.id, currentUser.uid)
            } else {
                await upvoteComplaint(complaint.id, currentUser.uid)
            }
        } finally {
            setIsVoting(false)
        }
    }

    return (
        <Link href={isAdminView ? `/admin/issues/${complaint.id}` : `/forum/${complaint.id}`}>
            <div className={`group flex gap-0 border rounded-xl overflow-hidden transition-all duration-200 bg-card
                hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5
                ${isResolved ? "border-green-200 bg-green-50/30" : ""}`}>

                {/* ── Upvote Column ── */}
                <div className="flex flex-col items-center gap-1 py-4 px-3 bg-muted/30 border-r min-w-[62px]">
                    <button
                        onClick={handleUpvote}
                        disabled={isVoting || !currentUser}
                        title={hasVoted ? "Remove vote" : "Upvote this issue"}
                        className={`p-1.5 rounded-lg transition-all duration-150
                            ${hasVoted
                                ? "text-primary bg-primary/10 shadow-sm"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                            } disabled:opacity-40`}
                    >
                        <ArrowUp className={`w-5 h-5 ${isVoting ? "animate-bounce" : ""}`} />
                    </button>
                    <span className={`text-sm font-bold tabular-nums ${hasVoted ? "text-primary" : "text-foreground"}`}>
                        {upvoteCount}
                    </span>
                    <span className="text-[10px] text-muted-foreground">votes</span>
                </div>

                {/* ── Thread Content ── */}
                <div className="flex-1 p-4 min-w-0">
                    {/* Badge row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize
                            ${CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS.other}`}>
                            {complaint.category === "it" ? "IT / Network" : complaint.category || "General"}
                        </span>

                        {complaint.severity && complaint.severity !== "Low" && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border
                                ${SEVERITY_COLORS[complaint.severity] || SEVERITY_COLORS.Medium}`}>
                                <Flame className="w-3 h-3" />
                                {complaint.severity} Severity
                            </span>
                        )}

                        {complaint.duplicateCount > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                                <Copy className="w-3 h-3" />
                                +{complaint.duplicateCount} similar {complaint.duplicateCount === 1 ? "report" : "reports"}
                            </span>
                        )}

                        {complaint.taggedAuthority && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                <Tag className="w-3 h-3" />
                                @{complaint.taggedAuthority}
                            </span>
                        )}

                        {isResolved && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200 ml-auto">
                                <CheckCircle2 className="w-3 h-3" />
                                Resolved
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className={`font-semibold text-base leading-snug mb-1.5 group-hover:text-primary transition-colors
                        ${isResolved ? "line-through text-muted-foreground" : ""}`}>
                        {complaint.title}
                    </h3>

                    {/* Description snippet */}
                    {complaint.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {complaint.description}
                        </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        {complaint.location?.building && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {complaint.location.building}
                                {complaint.location.floor && `, Floor ${complaint.location.floor}`}
                                {complaint.location.room && ` · Room ${complaint.location.room}`}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            {timeAgo(complaint.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 shrink-0" />
                            {commentCount} {commentCount === 1 ? "reply" : "replies"}
                        </span>
                        <span className="ml-auto text-xs italic">
                            {complaint.anonymous ? "by anonymous" : complaint.userEmail ? `by ${complaint.userEmail.split("@")[0]}` : ""}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
