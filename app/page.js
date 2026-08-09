import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  LayoutDashboard,
  GraduationCap,
  ShieldAlert,
  Building2,
  UserCircle,
  ShieldCheck,
  CheckCircle2,
  ListTodo,
  Users,
  Sparkles,
  ScanSearch,
  ShieldX,
  Layers
} from "lucide-react"

import Image from "next/image"
import ScrollStack, { ScrollStackItem } from "@/components/ui/ScrollStack"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="relative w-8 h-8">
            <Image src="/raiseit-2-Photoroom.png" alt="RaiseIt" fill className="object-contain" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">RaiseIt</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Button asChild variant="ghost" className="text-sm font-medium hover:text-primary transition-colors">
            <Link href="#controls">Role Features</Link>
          </Button>
          <Button asChild size="sm" className="px-6 rounded-full font-semibold shadow-lg shadow-primary/20">
            <Link href="/auth/login">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="w-full pt-12 md:pt-24 lg:pt-32 pb-24 bg-gradient-to-br from-indigo-50 via-background to-purple-50 dark:from-background dark:to-muted/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl text-center mx-auto" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl text-center mx-auto" />

          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center text-center">
              <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-left-4 duration-1000">
                <div className="space-y-4">
                  <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary w-fit mx-auto">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Smart Campus Governance
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl/none text-foreground">
                    Build a Better <span className="text-primary">Campus</span> Together.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed mx-auto">
                    Turn campus problems into actionable solutions.<p></p>
                    Report, monitor, and resolve — all in one place.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Button asChild size="lg" className="h-16 px-10 rounded-full text-lg font-bold shadow-xl shadow-primary/30 transition-all hover:scale-105">
                    <Link href="/auth/login">
                      Get Started Now <ArrowRight className="ml-2 h-6 w-6" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="relative mx-auto lg:ml-auto w-full max-w-[800px] flex items-center justify-center animate-in fade-in zoom-in-95 duration-1000 delay-200">
                <div className="relative rounded-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-muted/20 bg-background w-full transition-transform hover:rotate-1">
                  <img
                    src="/hero-image.png"
                    alt="Campus Management Interface"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI-Powered Verification Section */}
        <section className="w-full py-24 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-14">
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary w-fit mx-auto">
                <Sparkles className="h-4 w-4 mr-1" />
                Powered by AI
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Smarter Reporting, Verified by AI</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Every report is checked by AI before it reaches the queue — so authorities only see real, unique, and accurately prioritized issues.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col p-8 rounded-2xl border bg-white dark:bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <ScanSearch className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Image Verification</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every uploaded photo is analyzed by AI to confirm it actually matches the reported issue — fake or unrelated images are automatically rejected before submission.
                </p>
              </div>

              <div className="flex flex-col p-8 rounded-2xl border bg-white dark:bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
                  <Layers className="h-7 w-7 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Duplicate Detection & Escalation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Similar reports from the same location are automatically merged into a single complaint, and its severity is escalated with every new match — surfacing widespread problems faster.
                </p>
              </div>

              <div className="flex flex-col p-8 rounded-2xl border bg-white dark:bg-card shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                  <ShieldX className="h-7 w-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Fair-Use Limits</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Each student can submit up to 5 complaints per day, keeping the queue meaningful and preventing spam or abuse of the reporting system.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Role Based Control Section with ScrollStack */}
        <section id="controls" className="w-full py-24 bg-white dark:bg-background overflow-visible">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">3-Role Control System</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our ecosystem is built on transparency and accountability between all campus members.
                </p>
              </div>
            </div>
            
            <ScrollStack 
              itemDistance={80} 
              itemStackDistance={40} 
              baseScale={0.9} 
              itemScale={0.05}
            >
              {/* Student Control */}
              <ScrollStackItem>
                <div className="flex flex-col p-8 md:p-12 rounded-[2rem] border bg-white shadow-xl hover:border-primary/20 transition-all duration-500 group min-h-[400px]">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors shrink-0">
                      <UserCircle className="h-10 w-10 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-4">Student Control</h3>
                      <p className="text-xl text-muted-foreground mb-6">Your voice matters. Report issues directly and stay in the loop.</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> One-click issue reporting</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Real-time status tracking</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Community forum access</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> Personalized alerts</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollStackItem>

              {/* Department Control */}
              <ScrollStackItem>
                <div className="flex flex-col p-8 md:p-12 rounded-[2rem] border bg-white shadow-xl hover:border-violet-400/20 transition-all duration-500 group border-violet-100 min-h-[400px]">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-3xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-600 transition-colors shrink-0">
                      <Building2 className="h-10 w-10 text-violet-600 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-4 text-violet-700">Department Control</h3>
                      <p className="text-xl text-muted-foreground mb-6">Operational efficiency for departments to resolve tasks faster.</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-violet-600" /> Specialized task dashboards</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-violet-600" /> Priority task management</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-violet-600" /> Instant status updates</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-violet-600" /> Resource allocation tracking</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollStackItem>

              {/* Administrator Control */}
              <ScrollStackItem>
                <div className="flex flex-col p-8 md:p-12 rounded-[2rem] border bg-white shadow-xl hover:border-indigo-400/20 transition-all duration-500 group border-indigo-100 min-h-[400px]">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors shrink-0">
                      <ShieldCheck className="h-10 w-10 text-indigo-600 group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold mb-4 text-indigo-700">Admin Control</h3>
                      <p className="text-xl text-muted-foreground mb-6">Complete oversight and management of the campus ecosystem.</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-600" /> User account provisioning</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-600" /> Global system analytics</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-600" /> Policy & role management</li>
                        <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-indigo-600" /> Conflict resolution tools</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollStackItem>
            </ScrollStack>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-primary text-primary-foreground relative overflow-hidden flex justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-50" />

          <div className="container relative z-10 px-4 md:px-6 text-center mx-auto">
            <div className="flex flex-col items-center space-y-6 max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Transform Your Campus?</h2>
              <p className="mx-auto max-w-[700px] text-primary-foreground/90 md:text-xl font-light">
                Join the platform bringing transparency and efficiency.
              </p>
              <div className="flex justify-center">
                <Button asChild size="lg" variant="outline" className="h-16 px-12 rounded-full text-xl border-2 border-white/50 text-white bg-white/10 hover:bg-white hover:text-primary transition-all backdrop-blur-sm shadow-xl">
                  <Link href="/auth/login">
                    Get Started <ArrowRight className="ml-2 h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

     
    </div>
  )
}
