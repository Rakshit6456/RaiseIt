import { DashboardShell } from "@/components/layout/DashboardShell"
import { ReportIssueForm } from "@/components/forms/ReportIssueForm"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ReportIssuePage() {
    return (
        <DashboardShell role="student">
            <div className="mb-6">
                <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/student/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight mt-2">New Report</h1>
            </div>

            <ReportIssueForm />
        </DashboardShell>
    )
}
