import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"

export function AdminDashboardStats({ complaints = [] }) {
    const total = complaints.length
    const resolved = complaints.filter(c => c.status === "Resolved" || c.status === "Closed").length
    const pending = complaints.filter(c => c.status === "Pending").length
    const rejected = complaints.filter(c => c.status === "Rejected").length

    const stats = [
        {
            title: "Total Complaints",
            value: total,
            description: "All time reported",
            icon: AlertCircle,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            title: "Complaints Resolved",
            value: resolved,
            description: "Successfully closed",
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-100",
        },
        {
            title: "Pending",
            value: pending,
            description: "Awaiting action",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-100",
        },
        {
            title: "Rejected",
            value: rejected,
            description: "Invalid or duplicate",
            icon: XCircle,
            color: "text-red-500",
            bg: "bg-red-100",
        },
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <div className={`p-2 rounded-full ${stat.bg}`}>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
