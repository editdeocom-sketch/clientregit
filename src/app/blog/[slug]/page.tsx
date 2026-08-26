"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Clock, User, Calendar, Tag } from "lucide-react"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { Badge } from "@/components/ui/badge"

interface BlogPost {
  title: string
  category: string
  author: string
  date: string
  readTime: string
  content: string[]
}

const blogPosts: Record<string, BlogPost> = {
  "how-video-editors-can-manage-multiple-clients": {
    title: "How Video Editors Can Manage Multiple Clients",
    category: "Workflow",
    author: "ClientRegit Team",
    date: "Dec 5, 2026",
    readTime: "5 min read",
    content: [
      "Managing multiple clients simultaneously is one of the most common challenges freelance video editors face. Without a system in place, it's easy to lose track of deadlines, misplace feedback, and deliver files to the wrong person. The good news is that a few simple habits can transform your workflow.",
      "The first step is to establish a clear project structure for each client. Every client should have their own dedicated folder with consistent subfolders — raw footage, edits, exports, and assets. This prevents the nightmare of mixing up files between projects and makes handoffs much smoother.",
      "Next, set up a centralized system for tracking client communication. Instead of scattering feedback across emails, texts, and messaging apps, consolidate everything into one place. Tools like ClientRegit let you keep all client notes, feedback, and project status in a single dashboard so nothing falls through the cracks.",
      "Time management is another critical piece. When you have three clients all expecting revisions by Friday, you need a clear picture of how your hours break down. Block out dedicated time for each client rather than context-switching throughout the day. Batch similar tasks together — do all your color grading in one sitting, all your audio mixing in another.",
      "Finally, set expectations early and often. Agree on revision limits, turnaround times, and communication channels with each client before work begins. This reduces back-and-forth and helps you maintain boundaries as your workload grows.",
    ],
  },
  "how-to-organize-video-editing-projects": {
    title: "How to Organize Video Editing Projects",
    category: "Productivity",
    author: "ClientRegit Team",
    date: "Dec 1, 2026",
    readTime: "4 min read",
    content: [
      "A disorganized project folder is a silent productivity killer. Every minute spent searching for a file or wondering which version of a sequence is the latest is a minute you're not spending on creative work.",
      "Start with a consistent folder template. Every new project should begin with the same structure: a folder for raw footage, one for project files, one for exports, and one for assets like music, graphics, and fonts. Within the raw footage folder, organize by shoot day or camera angle if applicable.",
      "Naming conventions matter more than you think. Use a format that includes the project name, date, and version number. Something like ClientName_2026-12-01_v03 tells you everything at a glance. Avoid generic names like 'final_v2_REAL_final' — future you will thank you.",
      "Version control doesn't have to be complicated. Simply appending a version number to your exports and project files is enough for most freelancers. If you need more sophistication, consider tools that track file versions automatically.",
      "At the end of each project, take five minutes to archive the final deliverables and clean up unused files. This keeps your storage lean and makes it easy to reference past work if a client comes back for updates months later.",
    ],
  },
  "how-to-handle-client-revisions": {
    title: "How to Handle Client Revisions",
    category: "Workflow",
    author: "ClientRegit Team",
    date: "Nov 28, 2026",
    readTime: "6 min read",
    content: [
      "Revisions are an inevitable part of video editing. The difference between a smooth revision process and a frustrating one often comes down to how you set things up from the start.",
      "Begin by establishing clear revision limits in your contract or project agreement. Two rounds of revisions is standard for most projects. This gives clients enough opportunity to provide feedback without creating an endless loop of changes.",
      "When collecting feedback, ask clients to be specific. Vague comments like 'make it more dynamic' are hard to act on. Encourage clients to reference timestamps and provide concrete examples of what they'd like changed.",
      "Organization is key during revisions. Keep a running list of all requested changes and check them off as you complete them. This ensures nothing gets missed and gives you a clear record of what was agreed upon.",
      "If a client's revision requests go beyond the original scope — like asking for entirely new scenes or animations — don't be afraid to flag it as additional work. Being upfront about scope protects your time and keeps the relationship professional.",
      "After each revision round, deliver a clear summary of what changed and what's included in the new version. This helps clients see the progress and reduces the chance of re-doing work that was already approved.",
    ],
  },
  "how-to-get-better-video-feedback-from-clients": {
    title: "How to Get Better Video Feedback From Clients",
    category: "Tips",
    author: "ClientRegit Team",
    date: "Nov 25, 2026",
    readTime: "3 min read",
    content: [
      "Getting useful feedback from clients is one of the biggest pain points in video editing. Too often, you receive a wall of vague text or a frantic voice memo that's more emotion than direction.",
      "The most effective way to improve feedback quality is to guide your clients. Provide a simple feedback template with each draft delivery. Ask them to note the timestamp, describe the issue, and suggest a preferred direction.",
      "Review delivery platforms also make a difference. Instead of relying on email chains, use tools that let clients comment directly on the video at specific timecodes. This eliminates ambiguity and saves you from decoding what they meant.",
      "Set the tone early. In your kickoff communication, explain what good feedback looks like and why it matters. Most clients are happy to follow a process — they just don't know what you need.",
    ],
  },
  "how-freelance-video-editors-can-track-payments": {
    title: "How Freelance Video Editors Can Track Payments",
    category: "Business",
    author: "ClientRegit Team",
    date: "Nov 20, 2026",
    readTime: "5 min read",
    content: [
      "Tracking payments might not be the most exciting part of freelance video editing, but it's essential to running a sustainable business. Without a clear picture of what you're owed and what's been paid, you're flying blind.",
      "Start simple. Maintain a spreadsheet or use a dedicated tool to log every invoice you send. For each entry, record the client name, project, invoice amount, date sent, due date, and payment status. Update it regularly.",
      "Payment terms should be non-negotiable. Standard practice is net-15 or net-30, with a deposit of 25–50% upfront. Always get these terms in writing before starting work.",
      "Follow up professionally but firmly. If a payment is overdue, send a polite reminder within a few days. If it remains unpaid, escalate with a firmer message and consider pausing work until payment is received.",
      "Over time, your payment tracking will reveal patterns — which clients pay on time, which ones consistently delay, and which projects tend to go over budget. Use this data to make smarter decisions about who you work with and how you structure your agreements.",
    ],
  },
}

const categoryColors: Record<string, string> = {
  Workflow: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Productivity: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Tips: "bg-green-500/20 text-green-400 border-green-500/30",
  Business: "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

export default function BlogArticlePage() {
  const params = useParams()
  const slug = params.slug as string
  const post = blogPosts[slug]

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0B132B] text-white">
        <MarketingNavbar />
        <div className="pt-32 pb-20 px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
            <p className="text-white/50 mb-8">The article you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </div>
        </div>
        <MarketingFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-white">
      <MarketingNavbar />

      <article className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <div className="mb-8">
            <Badge
              variant="outline"
              className={`mb-4 ${categoryColors[post.category] || "border-white/20 bg-white/10 text-white"}`}
            >
              <Tag className="h-3 w-3 mr-1" />
              {post.category}
            </Badge>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-6">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {post.date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {post.readTime}
              </span>
            </div>
          </div>

          <div className="h-px bg-white/10 mb-10" />

          <div className="space-y-6">
            {post.content.map((paragraph, index) => (
              <p key={index} className="text-base text-white/70 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="h-px bg-white/10 my-12" />

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to streamline your workflow?</h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Manage your clients, projects, and deliveries from one clean workspace.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-[#0B132B] hover:bg-white/90 px-6 py-3 rounded-md font-medium transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </article>

      <MarketingFooter />
    </div>
  )
}
