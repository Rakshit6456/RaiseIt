"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Activity, Mail, Tag, Hash, Calendar } from "lucide-react"
import { useComplaints } from "@/context/ComplaintContext"

function getStatusColor(status) {
    switch (status) {
        case "Resolved": return "bg-green-100 text-green-700 hover:bg-green-100/80";
        case "Rejected": return "bg-red-100 text-red-700 hover:bg-red-100/80";
        case "In Progress": return "bg-blue-100 text-blue-700 hover:bg-blue-100/80";
        case "Closed": return "bg-gray-100 text-gray-700 hover:bg-gray-100/80";
        default: return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80";
    }
}

export function AdminRecentActivity({ complaints = [] }) {
    const { updateStatus } = useComplaints()

    const handleStatusChange = (id, newStatus) => {
        updateStatus(id, newStatus)
    }

    // Limit to 10 most recent
    const recent = complaints.slice(0, 10)

    return (
        <Card className="col-span-1 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Complaints Activities
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">
                                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> Code</span>
                                </TableHead>
                                <TableHead>
                                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Category</span>
                                </TableHead>
                                <TableHead>
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Submitted By</span>
                                </TableHead>
                                <TableHead>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</span>
                                </TableHead>
                                <TableHead className="text-right">Status Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recent.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No recent activity.
                                    </TableCell>
                                </TableRow>
                            ) : recent.map((activity) => (
                                <TableRow key={activity.id}>
                                    <TableCell className="font-medium font-mono text-xs whitespace-nowrap">{activity.id.substring(0, 8)}...</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium whitespace-nowrap">
                                            {activity.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={activity.userEmail}>
                                        {activity.userEmail}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                        {new Date(activity.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            <Badge className={`${getStatusColor(activity.status)} border-0 mr-2`}>
                                                {activity.status}
                                            </Badge>
                                            <div className="w-[130px]">
                                                <Select
                                                    value={activity.status}
                                                    onValueChange={(val) => handleStatusChange(activity.id, val)}
                                                >
                                                    <SelectTrigger className="h-7 text-xs">
                                                        <SelectValue placeholder="Update" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
