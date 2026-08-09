import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Clock, Timer } from "lucide-react"

export function DashboardStats({ complaints = [] }) {
    // Calculate stats
    const total = complaints.length
    const pending = complaints.filter(c => c.status === "Pending").length
    const inProgress = complaints.filter(c => c.status === "In Progress").length
    const resolved = complaints.filter(c => c.status === "Resolved" || c.status === "Closed").length

    const stats = [
        {
            title: "Pending",
            value: pending,
            description: "Awaiting acknowledgment",
            icon: Clock,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            title: "In Progress",
            value: inProgress,
            description: "Currently being resolved",
            icon: Timer,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            title: "Resolved",
            value: resolved,
            description: "Successfully closed",
            icon: CheckCircle2,
            color: "text-primary",
            bg: "bg-primary/10",
        },
        {
            title: "Total Reported",
            value: total,
            description: "Issues reported this semester",
            icon: AlertCircle,
            color: "text-muted-foreground",
            bg: "bg-secondary",
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
