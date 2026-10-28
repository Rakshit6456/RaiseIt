"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, ClipboardList, Loader2, Sparkles } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TEAMS = [
    "Electrical Department",
    "Plumbing Department",
    "IT Department",
    "Infrastructure Team",
    "Sanitation Team",
    "Security Office",
]
const PRIORITIES = ["Low", "Medium", "High", "Critical"]
const STATUSES = ["Assigned", "In Progress", "Completed", "Cancelled"]

function toDraft(workOrder, complaint) {
    const recommendedDepartment = TEAMS.includes(workOrder.recommendedDepartment) ? workOrder.recommendedDepartment : ""
    return {
        title: workOrder.title || "",
        issueSummary: workOrder.issueSummary || "",
        recommendedDepartment,
        recommendedTools: Array.isArray(workOrder.recommendedTools) ? workOrder.recommendedTools.join("\n") : "",
        recommendedSteps: Array.isArray(workOrder.recommendedSteps) ? workOrder.recommendedSteps.join("\n") : "",
        safetyPrecautions: Array.isArray(workOrder.safetyPrecautions) ? workOrder.safetyPrecautions.join("\n") : "",
        estimatedDuration: workOrder.estimatedDuration || "",
        suggestedPriority: PRIORITIES.includes(workOrder.suggestedPriority) ? workOrder.suggestedPriority : "Medium",
        assignedTeam: TEAMS.includes(workOrder.assignedTeam)
            ? workOrder.assignedTeam
            : recommendedDepartment || (TEAMS.includes(complaint.taggedAuthority) ? complaint.taggedAuthority : ""),
        status: STATUSES.includes(workOrder.status) ? workOrder.status : "Assigned",
    }
}

function listFromText(value) {
    return value.split("\n").map(item => item.trim()).filter(Boolean).slice(0, 8)
}

export function WorkOrderPanel({ complaint }) {
    const { currentUser, userData } = useAuth()
    const [draft, setDraft] = useState(null)
    const [persisted, setPersisted] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState("")
    const [notice, setNotice] = useState("")

    useEffect(() => {
        let active = true
        const loadWorkOrder = async () => {
            if (userData?.role !== "admin" || !currentUser || currentUser.isGuest) {
                setInitialLoading(false)
                return
            }
            try {
                const token = await currentUser.getIdToken()
                const response = await fetch(`/api/admin/complaints/${encodeURIComponent(complaint.id)}/work-order`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                })
                const result = await response.json()
                if (!response.ok) throw new Error(result.message || "Could not load this work order.")
                if (active && result.workOrder) {
                    setPersisted(result.workOrder)
                    setDraft(toDraft(result.workOrder, complaint))
                }
            } catch (requestError) {
                if (active) setError(requestError.message || "Could not load this work order.")
            } finally {
                if (active) setInitialLoading(false)
            }
        }
        loadWorkOrder()
        return () => { active = false }
    }, [complaint, currentUser, userData?.role])

    if (userData?.role !== "admin") return null

    const requestHeaders = async () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${await currentUser.getIdToken()}`,
    })

    const updateDraft = (key, value) => setDraft(current => ({ ...current, [key]: value }))

    const handleGenerate = async () => {
        setLoading(true)
        setError("")
        setNotice("")
        try {
            const response = await fetch(`/api/admin/complaints/${encodeURIComponent(complaint.id)}/work-order`, {
                method: "POST",
                headers: await requestHeaders(),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || "Could not generate a work order.")
            const generatedDraft = toDraft(result.workOrder, complaint)
            if (persisted) {
                generatedDraft.assignedTeam = persisted.assignedTeam || generatedDraft.assignedTeam
                generatedDraft.status = persisted.status || generatedDraft.status
            }
            setDraft(generatedDraft)
            setNotice("AI suggestions are ready. Review and edit every field before saving.")
        } catch (requestError) {
            setError(requestError.message || "Could not generate a work order. Please retry.")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!draft) return
        setSaving(true)
        setError("")
        setNotice("")
        try {
            const payload = {
                ...draft,
                expectedUpdatedAt: persisted?.updatedAt || null,
                recommendedTools: listFromText(draft.recommendedTools),
                recommendedSteps: listFromText(draft.recommendedSteps),
                safetyPrecautions: listFromText(draft.safetyPrecautions),
            }
            const response = await fetch(`/api/admin/complaints/${encodeURIComponent(complaint.id)}/work-order`, {
                method: "PUT",
                headers: await requestHeaders(),
                body: JSON.stringify(payload),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || "Could not save the work order.")
            setPersisted(result.workOrder)
            setDraft(toDraft(result.workOrder, complaint))
            setNotice("Work order saved and assigned successfully.")
        } catch (requestError) {
            setError(requestError.message || "Could not save the work order. Please retry.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="border rounded-xl bg-card p-5 sm:p-6 space-y-5" aria-labelledby="work-order-heading">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 id="work-order-heading" className="text-lg font-bold flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" /> Maintenance Work Order
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Create a technician brief from this complaint for administrator review.</p>
                </div>
                <Button type="button" variant="outline" onClick={handleGenerate} disabled={loading || saving || initialLoading}>
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    {loading ? "Generating..." : persisted ? "Generate new suggestions" : "Generate Work Order"}
                </Button>
            </div>

            {initialLoading && <p className="text-sm text-muted-foreground">Checking for an existing work order...</p>}
            {persisted && !initialLoading && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm rounded-md bg-muted/40 p-3">
                    <span><strong>Work order:</strong> {persisted.id}</span>
                    <span><strong>Status:</strong> {persisted.status}</span>
                    {persisted.updatedAt && <span><strong>Updated:</strong> {new Date(persisted.updatedAt).toLocaleString()}</span>}
                </div>
            )}
            <p className="text-xs text-muted-foreground">AI generated steps, tools, priorities, and duration are suggestions. Review them before assigning work. Qualified personnel must assess electrical and structural hazards.</p>

            {draft && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="wo-title">Work order title</Label>
                        <Input id="wo-title" maxLength={120} value={draft.title} onChange={event => updateDraft("title", event.target.value)} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="wo-summary">Issue summary</Label>
                        <Textarea id="wo-summary" maxLength={1000} value={draft.issueSummary} onChange={event => updateDraft("issueSummary", event.target.value)} className="min-h-20" />
                    </div>
                    <div className="space-y-2">
                        <Label>Recommended department</Label>
                        <Select value={draft.recommendedDepartment || "__none__"} onValueChange={value => updateDraft("recommendedDepartment", value === "__none__" ? "" : value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Needs manual selection</SelectItem>
                                {TEAMS.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Suggested priority</Label>
                        <Select value={draft.suggestedPriority} onValueChange={value => updateDraft("suggestedPriority", value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{PRIORITIES.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Assign to maintenance team</Label>
                        <Select value={draft.assignedTeam || "__none__"} onValueChange={value => updateDraft("assignedTeam", value === "__none__" ? "" : value)}>
                            <SelectTrigger><SelectValue placeholder="Choose a team" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Choose a team</SelectItem>
                                {TEAMS.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Work order status</Label>
                        <Select value={draft.status} onValueChange={value => updateDraft("status", value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUSES.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wo-tools">Suggested tools and materials (one per line)</Label>
                        <Textarea id="wo-tools" value={draft.recommendedTools} onChange={event => updateDraft("recommendedTools", event.target.value)} className="min-h-24" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wo-steps">Suggested inspection and repair steps (one per line)</Label>
                        <Textarea id="wo-steps" value={draft.recommendedSteps} onChange={event => updateDraft("recommendedSteps", event.target.value)} className="min-h-24" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wo-safety">Safety precautions (one per line)</Label>
                        <Textarea id="wo-safety" value={draft.safetyPrecautions} onChange={event => updateDraft("safetyPrecautions", event.target.value)} className="min-h-24" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="wo-duration">Estimated duration (suggestion)</Label>
                        <Input id="wo-duration" maxLength={100} value={draft.estimatedDuration} onChange={event => updateDraft("estimatedDuration", event.target.value)} placeholder="Needs assessment" />
                    </div>
                </div>
            )}

            {error && <p role="alert" className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-md p-3">{error}</p>}
            {notice && <p role="status" className="text-sm text-green-700 border border-green-200 bg-green-50 rounded-md p-3">{notice}</p>}
            {draft && (
                <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" onClick={handleSave} disabled={saving || loading || !draft.assignedTeam || !draft.title.trim() || !draft.issueSummary.trim()}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        {saving ? "Saving..." : persisted ? "Save Work Order Changes" : "Approve & Assign Work Order"}
                    </Button>
                    {!draft.assignedTeam && <span className="text-xs text-muted-foreground">Choose a team before approval.</span>}
                </div>
            )}
            {persisted?.sourceComplaintId && <p className="text-xs text-muted-foreground">Source complaint: {persisted.sourceComplaintId}</p>}
            {complaint.safetyConcern && <p className="text-sm text-amber-800 flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />This complaint is marked as a possible safety concern. Refer hazards to qualified staff.</p>}
        </section>
    )
}
