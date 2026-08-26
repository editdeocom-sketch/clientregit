"use client"

import Link from "next/link"
import { ArrowRight, Clock, User, Calendar } from "lucide-react"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { Badge } from "@/components/ui/badge"

const blogPosts = [
  {
    slug: "how-video-editors-can-manage-multiple-clients",
    title: "How Video Editors Can Manage Multiple Clients",
    excerpt:
      "Juggling multiple clients is one of the biggest challenges for video editors. Here's how to stay organized and deliver quality work on time.",
    category: "Workflow",
    author: "ClientRegit Team",
    date: "Dec 5, 2026",
    readTime: "5 min read",
  },
  {
    slug: "how-to-organize-video-editing-projects",
    title: "How to Organize Video Editing Projects",
    excerpt:
      "A clean project structure saves hours of confusion. Learn the folder systems and naming conventions that keep your edits running smoothly.",
    category: "Productivity",
    author: "ClientRegit Team",
    date: "Dec 1, 2026",
    readTime: "4 min read",
  },
  {
    slug: "how-to-handle-client-revisions",
    title: "How to Handle Client Revisions",
    excerpt:
      "Revisions are part of the job, but they don't have to be painful. Discover a framework for handling feedback without losing your mind.",
    category: "Workflow",
    author: "ClientRegit Team",
    date: "Nov 28, 2026",
    readTime: "6 min read",
  },
  {
    slug: "how-to-get-better-video-feedback-from-clients",
    title: "How to Get Better Video Feedback From Clients",
    excerpt:
      "Vague feedback kills timelines. Learn how to set up a feedback process that gets you clear, actionable notes every time.",
    category: "Tips",
    author: "ClientRegit Team",
    date: "Nov 25, 2026",
    readTime: "3 min read",
  },
  {
    slug: "how-freelance-video-editors-can-track-payments",
    title: "How Freelance Video Editors Can Track Payments",
    excerpt:
      "Chasing invoices is exhausting. Build a simple payment tracking system so you always know who owes you what and when.",
    category: "Business",
    author: "ClientRegit Team",
    date: "Nov 20, 2026",
    readTime: "5 min read",
  },
]

const categoryColors: Record<string, string> = {
  Workflow: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Productivity: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
  Tips: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
  Business: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#3A506B]/30 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">Blog</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Tips and insights for creative professionals
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Practical advice on client management, workflow, and growing your creative business.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                <article className="h-full bg-muted/50 backdrop-blur-md border border-border rounded-xl p-6 flex flex-col hover:bg-muted transition-colors">
                  <Badge
                    variant="outline"
                    className={`w-fit mb-4 ${categoryColors[post.category] || "border-border bg-muted text-foreground"}`}
                  >
                    {post.category}
                  </Badge>

                  <h2 className="text-xl font-bold mb-3 group-hover:text-foreground/90 transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.date}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-foreground/70 group-hover:text-foreground transition-colors">
                    Read More
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
