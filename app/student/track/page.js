import { DashboardShell } from "@/components/layout/DashboardShell"
import { ComplaintsList } from "@/components/dashboard/ComplaintsList"

export default function MyComplaintsPage() {
    return (
        <DashboardShell role="student">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Track My Issues</h1>
                <p className="text-muted-foreground mt-1">Monitor the real-time status and history of your reported campus problems.</p>
            </div>

            <ComplaintsList isAdmin={false} />
        </DashboardShell>
    )
}
