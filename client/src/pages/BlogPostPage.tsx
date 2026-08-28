import { Link, useParams } from "react-router-dom"
import { MarketingContentPage } from "@/pages/MarketingContentPage"

const titles: Record<string, string> = {
  "better-video-client-reviews": "How to run better video client reviews",
  "creative-project-workflow": "A calmer workflow for creative projects",
  "invoice-workflow-for-freelancers": "A simple invoice workflow for freelancers",
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const title = slug ? titles[slug] : undefined
  if (!title) return <MarketingContentPage title="Article not found" description="This article is not available."><Link className="text-primary hover:underline" to="/blog">Back to the blog</Link></MarketingContentPage>
  return <MarketingContentPage title={title} description="Practical guidance from the ClientRegit team.">
    <p>Creative work gets easier to deliver when everyone can see the current status, the next action, and the exact feedback that needs attention.</p>
    <p>Use a consistent project workflow: capture the brief, set a deadline, share a review version, collect timestamped feedback, and record approval or requested changes.</p>
    <Link className="text-primary hover:underline" to="/blog">Back to the blog</Link>
  </MarketingContentPage>
}
