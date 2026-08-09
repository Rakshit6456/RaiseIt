import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, MapPin } from "lucide-react"

function StatusBadge({ status }) {
    const styles = {
        "Pending": "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
        "In Progress": "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200",
        "Resolved": "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200",
        "Rejected": "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200",
        "Closed": "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
    }
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || "bg-gray-100 text-gray-800"}`}>
            {status}
        </span>
    )
}

function formatDate(dateInput) {
    if (!dateInput) return ""
    // Handle Firestore Timestamp or Date object or String
    const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput)
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24)),
        'day'
    )
}

export function RecentComplaints({ complaints = [] }) {
    // Show only first 5 recent complaints
    const recent = complaints.slice(0, 5)

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        You have {complaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected').length} ongoing complaints.
                    </CardDescription>
                </div>
                <Button asChild size="sm" variant="outline">
                    <Link href="/student/complaints">
                        View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {recent.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No complaints reported yet.</p>
                    ) : recent.map((complaint) => (
                        <div key={complaint.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div className="space-y-1">
                                <p className="font-medium leading-none">{complaint.title}</p>
                                <div className="flex items-center text-xs text-muted-foreground gap-2">
                                    <span>{complaint.id}</span>
                                    <span>•</span>
                                    <span className="flex items-center">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {complaint.location?.building || "Unknown Location"}
                                    </span>
                                </div>
                                <div className="mt-1">
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-secondary/50 text-secondary-foreground border border-border">
                                        {complaint.category}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <StatusBadge status={complaint.status} />
                                <span className="text-xs text-muted-foreground">
                                    {/* Simple date display for now */}
                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
