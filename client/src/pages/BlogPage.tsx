import { Link } from "react-router-dom"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { GlassCard } from "@/components/layout/glass-card"

const posts = [
  { slug: "better-video-client-reviews", title: "How to run better video client reviews", description: "A practical workflow for timestamped feedback, revisions, and approvals." },
  { slug: "creative-project-workflow", title: "A calmer workflow for creative projects", description: "Keep project status, deadlines, and client communication in one place." },
  { slug: "invoice-workflow-for-freelancers", title: "A simple invoice workflow for freelancers", description: "Create, share, track, and reconcile invoices without losing context." },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-36">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">ClientRegit Journal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Ideas for better creative operations</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Practical guidance for managing clients, projects, reviews, and payments.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((post) => <GlassCard key={post.slug} className="p-6 hover-lift">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Guide</p>
            <h2 className="mt-3 text-xl font-semibold text-foreground">{post.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.description}</p>
            <Link to={`/blog/${post.slug}`} className="mt-5 inline-flex text-sm font-medium text-primary hover:underline">Read article</Link>
          </GlassCard>)}
        </div>
      </main>
      <MarketingFooter />
    </div>
  )
}
