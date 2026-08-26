"use client"

import { useState } from "react"
import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { CookieConsent } from "@/components/marketing/cookie-consent"
import { GlassCard } from "@/components/layout/glass-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Mail } from "lucide-react"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      toast.success("Message sent! We'll get back to you soon.")
      setName("")
      setEmail("")
      setSubject("")
      setMessage("")
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-white">
      <MarketingNavbar />

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#3A506B]/30 to-transparent blur-3xl pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-widest text-white/50 mb-6">Contact</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Get in Touch
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/60 leading-relaxed">
            Have a question, suggestion, or just want to say hello? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white/70">Name</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-white/20">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0B132B] border-white/10">
                      <SelectItem value="general" className="text-white focus:bg-white/10 focus:text-white">
                        General Inquiry
                      </SelectItem>
                      <SelectItem value="support" className="text-white focus:bg-white/10 focus:text-white">
                        Support
                      </SelectItem>
                      <SelectItem value="billing" className="text-white focus:bg-white/10 focus:text-white">
                        Billing
                      </SelectItem>
                      <SelectItem value="feedback" className="text-white focus:bg-white/10 focus:text-white">
                        Feedback
                      </SelectItem>
                      <SelectItem value="other" className="text-white focus:bg-white/10 focus:text-white">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white/70">Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20 resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-white text-[#0B132B] hover:bg-white/90 px-8"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Email Us</h3>
              <p className="text-sm text-white/50 mb-4">
                We typically respond within 24 hours.
              </p>
              <div className="flex items-center gap-3 text-white/70">
                <Mail className="h-5 w-5" />
                <a
                  href="mailto:hello@clientregit.com"
                  className="text-sm hover:text-white transition-colors"
                >
                  hello@clientregit.com
                </a>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Follow Us</h3>
              <p className="text-sm text-white/50">
                Stay updated with the latest news and product updates.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      <div className="mt-20">
        <MarketingFooter />
      </div>
      <CookieConsent />
    </div>
  )
}
