"use client"

import { useState } from "react"
import { useComplaints } from "@/context/ComplaintContext"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Search, MapPin, Calendar, Filter } from "lucide-react"

function StatusBadge({ status }) {
    const styles = {
        "Pending": "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
        "In Progress": "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
        "Resolved": "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
        "Closed": "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200",
        "Rejected": "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
    }
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    )
}

export function ComplaintsList({ isAdmin = false }) {
    const { complaints } = useComplaints()
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [categoryFilter, setCategoryFilter] = useState("all")

    // Filter Logic
    const filteredComplaints = complaints.filter(complaint => {
        const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || complaint.status.toLowerCase().replace(" ", "") === statusFilter
        const matchesCategory = categoryFilter === "all" || complaint.category.toLowerCase().includes(categoryFilter)

        return matchesSearch && matchesStatus && matchesCategory
    })

    const linkPath = isAdmin ? "/admin/complaints" : "/student/complaints"

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by Title or ID..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inprogress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="infrastructure">Infrastructure</SelectItem>
                            <SelectItem value="sanitation">Sanitation</SelectItem>
                            <SelectItem value="it">IT / Network</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => (
                        <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{complaint.id}</span>
                                            <span className="text-xs text-muted-foreground bg-primary/5 text-primary px-1.5 py-0.5 rounded">{complaint.category}</span>
                                        </div>
                                        <h3 className="font-semibold text-lg leading-tight">{complaint.title}</h3>
                                    </div>
                                    <StatusBadge status={complaint.status} />
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-3 mt-2">
                                    <span className="flex items-center">
                                        <MapPin className="w-3.5 h-3.5 mr-1.5" />
                                        {complaint.location?.building || "Unknown Location"}
                                    </span>
                                    <span className="hidden sm:inline text-border">|</span>
                                    <span className="flex items-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        Reported on {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : complaint.date}
                                    </span>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-auto p-0 hover:bg-transparent" asChild>
                                        <Link href={`${linkPath}/${complaint.id}`}>View Timeline &rarr;</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">No complaints found matching your filters.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
