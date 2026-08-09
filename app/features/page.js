import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, LayoutDashboard } from "lucide-react"

export default function FeaturesPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation */}
            <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <Link className="flex items-center justify-center gap-2" href="/">
                    <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                        <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-xl tracking-tight">InfraTrack</span>
                </Link>
                <nav className="ml-auto flex items-center gap-4 sm:gap-6">
                    <Button asChild size="sm" variant="ghost">
                        <Link href="/">Back to Home</Link>
                    </Button>
                    <Button asChild size="sm" className="px-6 rounded-full">
                        <Link href="/auth/login">Get Started</Link>
                    </Button>
                </nav>
            </header>

            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary">Key Features</div>
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl">Designed for Everyone</h1>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Whether you're a student reporting a broken fan or an admin managing campus facilities, we've got you covered.
                            </p>
                        </div>

                        <div className="grid gap-12 lg:grid-cols-2">
                            {/* Feature Group 1 */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <Users className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold">For Campus Members</h3>
                                </div>
                                <div className="grid gap-6 pl-4 border-l-2 border-muted">
                                    <FeatureItem
                                        title="Easy Submission"
                                        description="Report issues in seconds with smart categories and location tagging."
                                    />
                                    <FeatureItem
                                        title="Privacy First"
                                        description="Option to report problems anonymously without fear of judgment."
                                    />
                                    <FeatureItem
                                        title="Visual Proof"
                                        description="Upload images directly to attest to the severity of the issue."
                                    />
                                    <FeatureItem
                                        title="Live Tracking"
                                        description="Watch your report move from Pending to In Progress to Resolved."
                                    />
                                </div>
                            </div>

                            {/* Feature Group 2 */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600">
                                        <LayoutDashboard className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold">For Administrators</h3>
                                </div>
                                <div className="grid gap-6 pl-4 border-l-2 border-muted">
                                    <FeatureItem
                                        title="Centralized Dashboard"
                                        description="A bird's eye view of all campus infrastructure health in one place."
                                    />
                                    <FeatureItem
                                        title="Smart Filtering"
                                        description="Sort by urgency, category, or status to prioritize critical repairs."
                                    />
                                    <FeatureItem
                                        title="Lifecycle Management"
                                        description="Update statuses transparently and keep the community informed."
                                    />
                                    <FeatureItem
                                        title="Data Insights"
                                        description="Track resolution times and identify recurring infrastructure problems."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-muted/20">
                <p className="text-xs text-muted-foreground">&copy; 2026 InfraTrack. All rights reserved.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground" href="#">
                        Terms of Service
                    </Link>
                    <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground" href="#">
                        Privacy
                    </Link>
                </nav>
            </footer>
        </div>
    )
}

function FeatureItem({ title, description }) {
    return (
        <div className="grid gap-1">
            <h4 className="text-lg font-bold flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {title}
            </h4>
            <p className="text-sm text-muted-foreground pl-3.5">
                {description}
            </p>
        </div>
    )
}
