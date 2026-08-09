"use client"

import { useState } from "react"
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
import { Upload, X } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export function ReportIssueForm() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [images, setImages] = useState([])
    const [files, setFiles] = useState([])
    const { currentUser } = useAuth()

    // Form State
    const [category, setCategory] = useState("")
    const [title, setTitle] = useState("")
    const [building, setBuilding] = useState("")
    const [floor, setFloor] = useState("")
    const [room, setRoom] = useState("")
    const [description, setDescription] = useState("")
    const [anonymous, setAnonymous] = useState(false)
    const [taggedAuthority, setTaggedAuthority] = useState("")

    // Safety check for user
    if (!currentUser) {
        // Ideally show a loading or redirect
    }

    const handleImageUpload = (e) => {
        const selectedFiles = Array.from(e.target.files)
        if (selectedFiles.length > 0) {
            // Mock preview URLs
            const newImages = selectedFiles.map(file => URL.createObjectURL(file))
            setImages(prev => [...prev, ...newImages])
            setFiles(prev => [...prev, ...selectedFiles])
        }
    }

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index))
        setFiles(prev => prev.filter((_, i) => i !== index))
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
            formData.append("userId", currentUser?.uid || "unknown")
            formData.append("userEmail", currentUser?.email || "unknown")

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
                                <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                            </label>
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