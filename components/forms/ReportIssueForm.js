"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle, Loader2, Sparkles, Upload, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { COMPLAINT_AUTHORITIES } from "@/lib/complaint-options"

export function ReportIssueForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [images, setImages] = useState([])
    const [files, setFiles] = useState([])
    const [analysisLoading, setAnalysisLoading] = useState(false)
    const [analysisError, setAnalysisError] = useState("")
    const [analysisSummary, setAnalysisSummary] = useState("")
    const [analysisEvidence, setAnalysisEvidence] = useState("")
    const previousAiSuggestion = useRef(null)
    const { currentUser } = useAuth()

    // Form State
    const [category, setCategory] = useState("")
    const [title, setTitle] = useState("")
    const [building, setBuilding] = useState("")
    const [floor, setFloor] = useState("")
    const [room, setRoom] = useState("")
    const [description, setDescription] = useState("")
    const [asset, setAsset] = useState("")
    const [severityScore, setSeverityScore] = useState(3)
    const [priority, setPriority] = useState("Medium")
    const [safetyConcern, setSafetyConcern] = useState(false)
    const [analysisReasoning, setAnalysisReasoning] = useState("")
    const [anonymous, setAnonymous] = useState(false)
    const [taggedAuthority, setTaggedAuthority] = useState("")

    // Safety check for user
    if (!currentUser) {
        // Ideally show a loading or redirect
    }

    const handleImageUpload = (e) => {
        const selectedFiles = Array.from(e.target.files)
        e.target.value = ""
        if (!selectedFiles.length) return

        const validFiles = selectedFiles.filter(file =>
            ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024
        )
        const remaining = Math.max(0, 3 - files.length)
        if (validFiles.length < selectedFiles.length) {
            setError("Use JPEG, PNG, or WebP images no larger than 5 MB each.")
        } else if (validFiles.length > remaining) {
            setError("You can attach up to 3 images.")
        } else {
            setError("")
        }
        const acceptedFiles = validFiles.slice(0, remaining)
        if (acceptedFiles.length > 0) {
            setAnalysisError("")
            setImages(prev => [...prev, ...acceptedFiles.map(file => URL.createObjectURL(file))])
            setFiles(prev => [...prev, ...acceptedFiles])
        }
    }

    const removeImage = (index) => {
        URL.revokeObjectURL(images[index])
        setImages(prev => prev.filter((_, i) => i !== index))
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleAnalyzeImage = async () => {
        setAnalysisError("")
        setAnalysisSummary("")
        setAnalysisEvidence("")
        if (!currentUser || currentUser.isGuest) {
            setAnalysisError("Sign in with your campus account to analyze an image.")
            return
        }
        if (!files[0]) {
            setAnalysisError("Upload an image before starting analysis.")
            return
        }

        setAnalysisLoading(true)
        try {
            const formData = new FormData()
            formData.append("file", files[0])
            const response = await fetch("/api/complaints/analyze", {
                method: "POST",
                body: formData,
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || "Image analysis failed.")

            const suggestion = result.analysis
            if (suggestion.isUncertain) {
                const previous = previousAiSuggestion.current
                if (previous) {
                    if (title === previous.title) setTitle("")
                    if (description === previous.description) setDescription("")
                    if (category === previous.category) setCategory("")
                    if (asset === previous.asset) setAsset("")
                    if (severityScore === previous.severity) setSeverityScore(3)
                    if (priority === previous.priority) setPriority("Medium")
                    if (safetyConcern === previous.safetyConcern) setSafetyConcern(false)
                    if (analysisReasoning === previous.reasoningSummary) setAnalysisReasoning("")
                    if (previous.recommendedDepartment && taggedAuthority === previous.recommendedDepartment) setTaggedAuthority("")
                }
                previousAiSuggestion.current = null
                setAnalysisSummary("AI could not identify a clear fault. Please describe the issue manually; you can still submit this report.")
                setAnalysisReasoning(suggestion.reasoningSummary || "")
                return
            }
            previousAiSuggestion.current = {
                title: suggestion.title || "",
                description: suggestion.description || "",
                category: suggestion.category || "",
                asset: suggestion.asset || "",
                severity: suggestion.severity || 3,
                priority: suggestion.priority || "Medium",
                safetyConcern: suggestion.safetyConcern === true,
                reasoningSummary: suggestion.reasoningSummary || "",
                recommendedDepartment: COMPLAINT_AUTHORITIES.includes(suggestion.recommendedDepartment) ? suggestion.recommendedDepartment : "",
            }
            setTitle(suggestion.title || "")
            setDescription(suggestion.description || "")
            if (suggestion.category) setCategory(suggestion.category)
            setAsset(suggestion.asset || "")
            setSeverityScore(suggestion.severity || 3)
            setPriority(suggestion.priority || "Medium")
            setSafetyConcern(suggestion.safetyConcern === true)
            setAnalysisReasoning(suggestion.reasoningSummary || "")
            setAnalysisEvidence(suggestion.visibleEvidence || "")
            if (COMPLAINT_AUTHORITIES.includes(suggestion.recommendedDepartment)) {
                setTaggedAuthority(suggestion.recommendedDepartment)
            }
            setAnalysisSummary("Suggestions are ready. Review and edit them before submitting.")
        } catch (requestError) {
            setAnalysisError(requestError.message || "Image analysis failed. You can continue manually or retry.")
        } finally {
            setAnalysisLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        
        // Validate required fields
        if (!title.trim() || !description.trim() || !category) {
            setError("Please fill in all required fields (title, description, and category)")
            return
        }

        if (!building.trim() || !floor.trim() || !room.trim()) {
            setError("Please provide complete location details (building, floor, room)")
            return
        }

        if (!currentUser || currentUser.isGuest) {
            setError("Please sign in with your campus account before submitting a report.")
            return
        }

        setLoading(true)
        try {
            const formData = new FormData()
            formData.append("title", title)
            formData.append("description", description)
            formData.append("category", category)
            formData.append("building", building)
            formData.append("floor", floor)
            formData.append("room", room)
            formData.append("anonymous", anonymous ? "true" : "false")
            formData.append("taggedAuthority", taggedAuthority)
            formData.append("asset", asset)
            formData.append("severityScore", String(severityScore))
            formData.append("priority", priority)
            formData.append("safetyConcern", safetyConcern ? "true" : "false")
            formData.append("analysisReasoning", analysisReasoning)

            for (const file of files) {
                formData.append("file", file)
            }

            console.log("Submitting complaint with data:", { title, category, location: { building, floor, room } })

            const res = await fetch("/api/complaints", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit complaint")
            }

            console.log("Complaint submitted successfully:", data)
            alert(data.message || "Complaint submitted successfully!")
            router.push("/student/dashboard")
        } catch (error) {
            console.error("Error submitting complaint:", error)
            setError(error.message || "Failed to submit complaint. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Report an Issue</CardTitle>
                <CardDescription>
                    Please provide detailed information to help us resolve the issue quickly.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="electrical">Electrical</SelectItem>
                                <SelectItem value="plumbing">Plumbing</SelectItem>
                                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                <SelectItem value="sanitation">Sanitation</SelectItem>
                                <SelectItem value="it">IT / Network</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Issue Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Broken Fan"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* Location Details */}
                    <div className="space-y-2">
                        <Label>Location</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Input
                                placeholder="Building Name"
                                value={building}
                                onChange={(e) => setBuilding(e.target.value)}
                                required
                            />
                            <Input
                                placeholder="Floor"
                                value={floor}
                                onChange={(e) => setFloor(e.target.value)}
                                required
                            />
                            <Input
                                placeholder="Room No."
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the issue in detail..."
                            className="min-h-[120px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    {/* Tag Authority */}
                    <div className="space-y-2">
                        <Label>Tag Authority <span className="text-muted-foreground font-normal text-xs">(Who should resolve this?)</span></Label>
                        <Select value={taggedAuthority} onValueChange={setTaggedAuthority}>
                            <SelectTrigger>
                                <SelectValue placeholder="@ Tag the responsible department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Electrical Department">⚡ Electrical Department</SelectItem>
                                <SelectItem value="Plumbing Department">🔧 Plumbing Department</SelectItem>
                                <SelectItem value="IT Department">💻 IT Department</SelectItem>
                                <SelectItem value="Hostel Warden">🏠 Hostel Warden</SelectItem>
                                <SelectItem value="Infrastructure Team">🏗️ Infrastructure Team</SelectItem>
                                <SelectItem value="Sanitation Team">🧹 Sanitation Team</SelectItem>
                                <SelectItem value="Security Office">🔒 Security Office</SelectItem>
                                <SelectItem value="Library Administration">📚 Library Administration</SelectItem>
                                <SelectItem value="Head of Department">👨‍🏫 Head of Department</SelectItem>
                                <SelectItem value="College Principal">🏛️ College Principal</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label>Photos (Optional)</Label>
                        <div className="grid grid-cols-3 gap-4">
                            {images.map((src, index) => (
                                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                <span className="text-xs text-muted-foreground text-center px-2">Click to Upload</span>
                                <input type="file" className="hidden" multiple accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
                            </label>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                            <p className="text-xs text-muted-foreground">Attach up to 3 JPEG, PNG, or WebP images (5 MB each).</p>
                            <Button type="button" variant="outline" onClick={handleAnalyzeImage} disabled={analysisLoading || files.length === 0}>
                                {analysisLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                {analysisLoading ? "Analyzing image..." : "Suggest details with AI"}
                            </Button>
                            {analysisSummary && <p className="text-sm text-green-700">{analysisSummary}</p>}
                            {analysisError && <p role="alert" className="text-sm text-red-700">{analysisError}</p>}
                            {analysisEvidence && <p className="text-sm text-muted-foreground">Visible evidence: {analysisEvidence}</p>}
                            {analysisReasoning && <p className="text-sm text-muted-foreground">AI note: {analysisReasoning}</p>}
                            {safetyConcern && <p className="text-sm text-amber-800 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />The photo may show a safety concern. This is an estimate and needs human assessment.</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="asset">Affected asset (optional)</Label>
                        <Input id="asset" placeholder="e.g. ceiling fan, projector, sink" value={asset} onChange={e => setAsset(e.target.value)} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="severityScore">Estimated severity (1–5)</Label>
                            <Select value={String(severityScore)} onValueChange={value => setSeverityScore(Number(value))}>
                                <SelectTrigger id="severityScore"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {[1, 2, 3, 4, 5].map(value => <SelectItem key={value} value={String(value)}>{value}{value === 1 ? " — Minor" : value === 5 ? " — Urgent" : ""}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["Low", "Medium", "High", "Critical"].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Anonymous Toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="anonymous"
                            checked={anonymous}
                            onChange={(e) => setAnonymous(e.target.checked)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="anonymous" className="font-normal">Report anonymously</Label>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Submitting..." : "Submit Report"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
