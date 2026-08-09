"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useComplaints } from "@/context/ComplaintContext"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import {
    ArrowUp, MessageSquare, MapPin, Clock, Tag, CheckCircle2,
    ArrowLeft, Send, Building2, Image as ImageIcon, Loader2
} from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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

const STATUS_STYLES = {
    "pending":     { bg: "bg-amber-100 text-amber-700 border-amber-200",  label: "Pending" },
    "Pending":     { bg: "bg-amber-100 text-amber-700 border-amber-200",  label: "Pending" },
    "In Progress": { bg: "bg-blue-100 text-blue-700 border-blue-200",     label: "In Progress" },
    "Resolved":    { bg: "bg-green-100 text-green-700 border-green-200",  label: "✅ Resolved" },
    "resolved":    { bg: "bg-green-100 text-green-700 border-green-200",  label: "✅ Resolved" },
    "Rejected":    { bg: "bg-red-100 text-red-700 border-red-200",        label: "❌ Rejected" },
    "rejected":    { bg: "bg-red-100 text-red-700 border-red-200",        label: "❌ Rejected" },
}

export default function DepartmentIssuePage() {
    const { id } = useParams()
    const { getComplaint, upvoteComplaint, removeUpvote, addComment, updateStatus, updateStage, addAdminComment } = useComplaints()
    const { currentUser, userData } = useAuth()

    const [comment, setComment] = useState("")
    const [submittingComment, setSubmittingComment] = useState(false)
    const [isVoting, setIsVoting] = useState(false)
    const [resolveNote, setResolveNote] = useState("")
    const [resolving, setResolving] = useState(false)
    const [lightboxSrc, setLightboxSrc] = useState(null)
    const [statusToUpdate, setStatusToUpdate] = useState("Pending")
    const [adminComment, setAdminComment] = useState("")
    const [submittingAdminComment, setSubmittingAdminComment] = useState(false)

    const complaint = getComplaint(id)

    useEffect(() => {
        if (complaint?.status) {
            setStatusToUpdate(complaint.status)
        }
    }, [complaint?.status])

    const handleUpvote = async () => {
        if (!currentUser || isVoting) return
        setIsVoting(true)
        const upvotes = complaint?.upvotes || []
        const hasVoted = upvotes.includes(currentUser.uid)
        try {
            if (hasVoted) await removeUpvote(id, currentUser.uid)
            else await upvoteComplaint(id, currentUser.uid)
        } finally { setIsVoting(false) }
    }

    const handleComment = async (e) => {
        e.preventDefault()
        if (!comment.trim() || !currentUser) return
        setSubmittingComment(true)
        try {
            const deptName = userData?.department || "Department"
            const author = `${deptName}`
            await addComment(id, author, comment.trim())
            setComment("")
        } finally { setSubmittingComment(false) }
    }

    const handleUpdateStatus = async () => {
        if (!statusToUpdate) return
        setResolving(true)
        try {
            await updateStatus(id, statusToUpdate, resolveNote || `Status updated by ${userData?.department || "Department"}`)
            setResolveNote("")
        } catch (err) {
            console.error("Failed to update status:", err)
        } finally { setResolving(false) }
    }

    const handleDeptCommentSubmit = async (e) => {
        e.preventDefault()
        if (!adminComment.trim() || !currentUser) return
        setSubmittingAdminComment(true)
        try {
            const author = userData?.department || currentUser.email?.split("@")[0] || "Department"
            await addAdminComment(id, author, adminComment.trim())
            setAdminComment("")
        } finally { setSubmittingAdminComment(false) }
    }

    if (!complaint) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="text-5xl">🔍</div>
                <p className="text-xl font-semibold text-muted-foreground">Thread not found</p>
                <Button asChild variant="outline" className="rounded-full">
                    <Link href="/department/dashboard">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Link>
                </Button>
            </div>
        )
    }

    const upvotes = complaint.upvotes || []
    const hasVoted = currentUser && upvotes.includes(currentUser.uid)
    const isResolved = complaint.status === "Resolved" || complaint.status === "resolved"
    const statusStyle = STATUS_STYLES[complaint.status] || STATUS_STYLES["Pending"]
    const comments = [...(complaint.comments || [])].sort(
        (a, b) => new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
    )

    return (
        <div>
            {lightboxSrc && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setLightboxSrc(null)}
                >
                    <img src={lightboxSrc} alt="Full view" className="max-h-[90vh] max-w-full rounded-xl object-contain" />
                </div>
            )}

            <div className="mb-4">
                <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
                    <Link href="/department/dashboard">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </Button>
            </div>

            <div className="flex gap-6 items-start">
                {/* Main Content */}
                <div className="flex-1 min-w-0 space-y-6">
                    {/* Complaint Card */}
                    <div className={`border rounded-xl overflow-hidden bg-card ${isResolved ? "border-green-300" : ""}`}>
                        <div className="flex">
                            {/* Vote Column */}
                            <div className="flex flex-col items-center gap-1.5 py-6 px-4 bg-muted/30 border-r min-w-[70px]">
                                <button
                                    onClick={handleUpvote}
                                    disabled={isVoting || !currentUser}
                                    className={`p-2 rounded-xl transition-all duration-150
                                        ${hasVoted
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "text-muted-foreground hover:bg-primary/10 hover:text-primary border"
                                        } disabled:opacity-40`}
                                    title={hasVoted ? "Remove vote" : "Upvote"}
                                >
                                    <ArrowUp className={`w-5 h-5 ${isVoting ? "animate-bounce" : ""}`} />
                                </button>
                                <span className={`text-lg font-bold tabular-nums ${hasVoted ? "text-primary" : ""}`}>
                                    {upvotes.length}
                                </span>
                                <span className="text-[10px] text-muted-foreground">votes</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg}`}>
                                        {statusStyle.label}
                                    </span>
                                    {complaint.category && (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-muted text-muted-foreground capitalize">
                                            {complaint.category === "it" ? "IT / Network" : complaint.category}
                                        </span>
                                    )}
                                    {complaint.taggedAuthority && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                                            <Tag className="w-3 h-3" />@{complaint.taggedAuthority}
                                        </span>
                                    )}
                                </div>

                                <h1 className={`text-2xl font-bold mb-3 ${isResolved ? "line-through text-muted-foreground" : ""}`}>
                                    {complaint.title}
                                </h1>

                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {complaint.description}
                                </p>

                                {complaint.images?.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <ImageIcon className="w-3.5 h-3.5" /> Attached Photos
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {complaint.images.map((src, i) => (
                                                <img
                                                    key={i}
                                                    src={src}
                                                    alt={`Attachment ${i + 1}`}
                                                    onClick={() => setLightboxSrc(src)}
                                                    className="w-full aspect-video object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-5 pt-4 border-t">
                                    {complaint.location?.building && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {complaint.location.building}
                                            {complaint.location.floor && `, Floor ${complaint.location.floor}`}
                                            {complaint.location.room && ` · Room ${complaint.location.room}`}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        Posted {timeAgo(complaint.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        {comments.length} {comments.length === 1 ? "reply" : "replies"}
                                    </span>
                                    <span className="ml-auto italic">
                                        {complaint.anonymous
                                            ? "Posted anonymously"
                                            : complaint.userEmail
                                                ? `Posted by ${complaint.userEmail.split("@")[0]}`
                                                : ""}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Resolution Panel */}
                    <div className="border border-dashed border-violet-400/60 rounded-xl p-5 bg-violet-50/40 space-y-4 shadow-sm dark:bg-violet-900/10">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-violet-700 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Department Resolution Panel
                            </p>
                            <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-violet-200">
                                {userData?.department || "Department"}
                            </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground ml-1">Update Status</label>
                                <Select value={statusToUpdate} onValueChange={setStatusToUpdate}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Resolved">Resolved ✅</SelectItem>
                                        <SelectItem value="Rejected">Rejected ❌</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground ml-1">Resolution Note (optional)</label>
                                <Textarea
                                    placeholder="Add a note about this status change..."
                                    value={resolveNote}
                                    onChange={(e) => setResolveNote(e.target.value)}
                                    className="text-sm min-h-[40px] h-[40px] py-2 resize-none"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-5 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                            onClick={handleUpdateStatus}
                            disabled={resolving}
                        >
                            {resolving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                            ) : (
                                "Update Complaint Status"
                            )}
                        </Button>
                    </div>

                    {/* Comments */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
                        </h2>

                        {comments.length === 0 && (
                            <div className="text-center py-10 border-2 border-dashed rounded-xl">
                                <p className="text-4xl mb-2">💬</p>
                                <p className="text-sm text-muted-foreground">No replies yet. Be the first to respond!</p>
                            </div>
                        )}

                        {comments.map((c, i) => {
                            const isDeptComment = c.author === userData?.department || c.author?.includes("Department")
                            return (
                                <div key={i}
                                    className={`flex gap-3 p-4 rounded-xl border transition-all
                                        ${isDeptComment
                                            ? "border-violet-200 bg-violet-50/60"
                                            : "border-muted/60 bg-card hover:border-muted"
                                        }`}
                                >
                                    <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold
                                        ${isDeptComment ? "bg-violet-200 text-violet-700" : "bg-primary/10 text-primary"}`}>
                                        {c.author?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-sm font-semibold">{c.author}</span>
                                            {isDeptComment && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-200 text-violet-700 font-bold uppercase tracking-wide">
                                                    Department
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {timeAgo(c.timestamp || c.date)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                    </div>
                                </div>
                            )
                        })}

                        {currentUser ? (
                            <form onSubmit={handleComment} className="space-y-3 border rounded-xl p-4 bg-muted/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold">
                                        {(userData?.department || currentUser.email)?.charAt(0)?.toUpperCase() || "D"}
                                    </div>
                                    <span className="text-sm font-medium">{userData?.department || currentUser.email?.split("@")[0]}</span>
                                    <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">
                                        Department
                                    </span>
                                </div>
                                <Textarea
                                    placeholder="Write a reply as department..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="min-h-[100px] text-sm resize-none"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!comment.trim() || submittingComment}
                                        className="rounded-full px-5"
                                    >
                                        <Send className="w-3.5 h-3.5 mr-2" />
                                        {submittingComment ? "Posting..." : "Post Reply"}
                                    </Button>
                                </div>
                            </form>
                        ) : null}
                    </div>
                </div>

                {/* Sidebar Details */}
                <div className="w-64 hidden lg:block shrink-0 space-y-4">
                    <div className="border rounded-xl p-4 space-y-3">
                        <h3 className="font-bold text-sm">📋 Issue Details</h3>
                        <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className={`px-2 py-0.5 rounded-full font-semibold border ${statusStyle.bg}`}>
                                    {statusStyle.label}
                                </span>
                            </div>
                            {complaint.category && (
                                <div className="flex justify-between">
                                    <span>Category</span>
                                    <span className="font-medium text-foreground capitalize">
                                        {complaint.category === "it" ? "IT / Network" : complaint.category}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Upvotes</span>
                                <span className="font-bold text-primary">{upvotes.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Replies</span>
                                <span className="font-medium text-foreground">{comments.length}</span>
                            </div>
                        </div>
                    </div>

                    {complaint.taggedAuthority && (
                        <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 space-y-2">
                            <h3 className="font-bold text-sm text-violet-700">🏢 Assigned To</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center font-bold text-sm">
                                    {complaint.taggedAuthority.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-violet-800">@{complaint.taggedAuthority}</p>
                                    <p className="text-[10px] text-violet-500">
                                        {isResolved ? "Resolved this issue ✅" : "Awaiting response..."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {complaint.resolutionNotes && isResolved && (
                        <div className="border border-green-200 bg-green-50 rounded-xl p-4 space-y-2">
                            <h3 className="font-bold text-sm text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Resolution Note
                            </h3>
                            <p className="text-xs text-green-800 leading-relaxed">{complaint.resolutionNotes}</p>
                        </div>
                    )}

                    <div className="border border-violet-200 bg-violet-50/50 rounded-xl p-4 space-y-3">
                        <h3 className="font-bold text-sm text-violet-700">📌 Current Stage</h3>
                        <Select
                            value={complaint.stage || "Reported"}
                            onValueChange={(val) => updateStage(id, val)}
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select Stage" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Reported">Reported</SelectItem>
                                <SelectItem value="In Review">In Review</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Resolved">Resolved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border rounded-xl p-4 space-y-3 bg-muted/10">
                        <h3 className="font-bold text-sm">🔒 Department Notes</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {(!complaint.adminComments || complaint.adminComments.length === 0) && (
                                <p className="text-xs text-muted-foreground italic">No internal notes yet.</p>
                            )}
                            {complaint.adminComments?.map((ac, i) => (
                                <div key={i} className="bg-card border rounded p-2 text-xs space-y-1">
                                    <div className="flex justify-between items-start gap-2 text-muted-foreground">
                                        <span className="font-bold text-primary">{ac.author}</span>
                                        <span className="text-[10px] shrink-0">{timeAgo(ac.timestamp || ac.date)}</span>
                                    </div>
                                    <p className="text-foreground whitespace-pre-wrap">{ac.text}</p>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleDeptCommentSubmit} className="space-y-2 pt-2 border-t">
                            <Textarea
                                placeholder="Add internal note..."
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                                className="min-h-[60px] h-[60px] text-xs resize-none"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="w-full text-xs h-8"
                                disabled={!adminComment.trim() || submittingAdminComment}
                            >
                                {submittingAdminComment ? "Saving..." : "Save Note"}
                            </Button>
                        </form>
                    </div>

                    <Button asChild variant="outline" className="w-full rounded-full" size="sm">
                        <Link href="/department/dashboard">
                            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}
