"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, BellRing, Info } from "lucide-react"

export function NotificationPanel({ complaints = [] }) {
    // Derive notifications from complaint timelines
    // We want to show recent updates where status changed or feedback given
    const notifications = []

    complaints.forEach(complaint => {
        if (complaint.timeline && complaint.timeline.length > 0) {
            // Sort timeline by date desc
            const sortedTimeline = [...complaint.timeline].sort((a, b) => {
                const dateA = a.timestamp ? (a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp)) : new Date(a.date)
                const dateB = b.timestamp ? (b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp)) : new Date(b.date)
                return dateB - dateA
            })

            // Take the latest event if it's not just "Complaint Reported"
            const latest = sortedTimeline[0]
            if (latest && latest.title !== "Complaint Reported") {
                notifications.push({
                    id: `${complaint.id}-${latest.date}`,
                    title: `${complaint.title}: ${latest.title}`,
                    status: complaint.status,
                    time: new Date(latest.date).toLocaleDateString(),
                    message: latest.description,
                    type: latest.title
                })
            }
        }
    })

    // Sort notifications by time (rough approximation using the string date if timestamp missing, but we used ISO strings)
    // Ideally we should store timestamps in timeline events. I did add timestamp: new Date() in Context updates.

    return (
        <Card className="col-span-1 border-l-4 border-l-primary shadow-md bg-secondary/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <BellRing className="w-4 h-4 text-primary" />
                    Updates
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notif, index) => (
                            <div key={index} className="flex gap-3 items-start p-3 rounded-lg bg-background border shadow-sm transition-all hover:shadow-md">
                                <div className="mt-0.5">
                                    {notif.status === 'Resolved' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : notif.status === 'Rejected' ? (
                                        <XCircle className="w-5 h-5 text-red-500" />
                                    ) : (
                                        <Info className="w-5 h-5 text-blue-500" />
                                    )}
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium leading-none">{notif.title}</p>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{notif.time}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notif.message}
                                    </p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${notif.status === 'Resolved' ? 'text-green-600' :
                                            notif.status === 'Rejected' ? 'text-red-600' : 'text-blue-600'
                                        }`}>
                                        {notif.status}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            No updates yet.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
