import { DashboardShell } from "@/components/layout/DashboardShell"

export default function DepartmentLayout({ children }) {
    return (
        <DashboardShell role="department">
            {children}
        </DashboardShell>
    )
}
