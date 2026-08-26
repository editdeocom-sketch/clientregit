import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { CookieConsent } from "@/components/marketing/cookie-consent"

export const metadata = {
  title: "About",
  description:
    "Learn about ClientRegit — the client management platform built for creative professionals.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#3A506B]/30 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">Our Story</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            About ClientRegit
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            A workspace designed to simplify client and project management for creative professionals
            who deserve better tools.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl space-y-12">
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">What We Do</h2>
            <p className="text-muted-foreground leading-relaxed">
              ClientRegit is designed to simplify client and project management for creative
              professionals. Built for video editors, designers, and freelancers who need one simple
              place to manage their workflow.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We saw that creative professionals were stitching together multiple disconnected
              tools — spreadsheets for client tracking, email for feedback, messaging apps for
              approvals — and losing hours every week in the process. ClientRegit brings everything
              into one clean, focused workspace.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To give creative professionals the tools they need to manage their clients and deliver
              exceptional work — without the complexity of enterprise software or the limitations of
              generic project management apps.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We believe that managing clients should be the easy part of your job, not the hard
              part. Every feature in ClientRegit is built with this belief in mind.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">The Team</h2>
            <p className="text-muted-foreground leading-relaxed">
              ClientRegit is built by a small team of designers and developers who understand the
              creative workflow firsthand. We&apos;re a remote team passionate about building tools
              that respect your time and attention.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We&apos;re always looking to improve. If you have feedback or ideas, we&apos;d love
              to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl text-center bg-muted/50 backdrop-blur-md border border-border rounded-xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join creative professionals who manage their clients, projects, and deliveries from one
            workspace.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-md font-medium transition-colors"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
      <CookieConsent />
    </div>
  )
}
