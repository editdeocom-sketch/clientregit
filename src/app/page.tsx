"use client";

import { useState } from "react";
import {
  Users,
  FolderKanban,
  Video,
  RefreshCw,
  CheckCircle,
  FileText,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  Zap,
  Palette,
  Clapperboard,
  Building2,
  Briefcase,
  VideoIcon,
} from "lucide-react";
import { WaveBackground } from "@/components/layout/wave-background";
import { GlassCard } from "@/components/layout/glass-card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Users,
    title: "Client Management",
    description: "Keep client information organized in one place.",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    description:
      "Track projects, deadlines and progress from start to finish.",
  },
  {
    icon: Video,
    title: "Video Reviews",
    description:
      "Share videos and collect timestamped feedback from clients.",
  },
  {
    icon: RefreshCw,
    title: "Revision Tracking",
    description: "Turn client feedback into actionable revisions quickly.",
  },
  {
    icon: CheckCircle,
    title: "Client Approvals",
    description: "Let clients approve completed versions with one click.",
  },
  {
    icon: FileText,
    title: "Invoice Tracking",
    description: "Track invoices and payment status for every project.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your client",
    description: "Import or create a client profile in seconds.",
  },
  {
    number: "02",
    title: "Create a project",
    description: "Set up a project, upload assets and invite your client.",
  },
  {
    number: "03",
    title: "Share and review videos",
    description: "Send video links and collect timestamped feedback.",
  },
  {
    number: "04",
    title: "Get approval and deliver",
    description: "Clients approve the final version with one click.",
  },
];

const whoIsItFor = [
  { icon: Clapperboard, title: "Video Editors" },
  { icon: Palette, title: "Graphic Designers" },
  { icon: Zap, title: "Content Creators" },
  { icon: Building2, title: "Creative Agencies" },
  { icon: Briefcase, title: "Freelancers" },
];

const faqs = [
  {
    question: "What is ClientRegit?",
    answer:
      "ClientRegit is a simple client management platform designed for creative professionals like video editors, designers, and freelancers.",
  },
  {
    question: "Who is ClientRegit for?",
    answer:
      "Video editors, graphic designers, content creators, creative agencies, and freelance professionals.",
  },
  {
    question: "Can video editors use ClientRegit?",
    answer: "Yes. ClientRegit is designed specifically with video editors in mind.",
  },
  {
    question: "Can clients review videos?",
    answer: "Yes. Clients can watch videos and leave timestamped comments.",
  },
  {
    question: "Can clients leave timestamp comments?",
    answer:
      "Yes. Clients can click on a specific timestamp and leave feedback at that exact moment in the video.",
  },
  {
    question: "Can clients approve videos?",
    answer:
      "Yes. Clients can approve completed video versions with a single click.",
  },
  {
    question: "Is ClientRegit free?",
    answer: "ClientRegit offers a free plan for individual freelancers.",
  },
  {
    question: "Does ClientRegit store videos?",
    answer:
      "Yes. Videos are securely stored and organized by project and version.",
  },
  {
    question: "Can I manage multiple clients?",
    answer: "Yes. You can manage unlimited clients and projects.",
  },
];

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "#blog" },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B132B] text-white">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B132B]/80 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <VideoIcon className="h-6 w-6 text-white" />
            ClientRegit
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-white/70 hover:text-white">
              Login
            </Button>
            <Button className="bg-white text-[#0B132B] hover:bg-white/90">
              Get Started
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0B132B]/95 backdrop-blur-md px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-sm text-white/70 hover:text-white transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="ghost" className="text-white/70 hover:text-white w-full">
                Login
              </Button>
              <Button className="bg-white text-[#0B132B] hover:bg-white/90 w-full">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-0 overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#3A506B]/30 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl text-center px-6">
          <p className="text-sm uppercase tracking-widest text-white/50 mb-6">
            A workspace for creative professionals
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
            Manage clients.
            <br />
            Deliver better work.
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/60 mb-10 leading-relaxed">
            ClientRegit helps creative professionals manage clients, projects,
            video reviews, revisions and invoices from one simple workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="bg-white text-[#0B132B] hover:bg-white/90 px-8 py-6 text-base">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base"
            >
              See How It Works
            </Button>
          </div>
        </div>

        <div className="relative z-10 w-full mt-20">
          <WaveBackground />
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Everything you need
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <GlassCard key={feature.title} variant="subtle" className="p-6">
                <feature.icon className="h-8 w-8 text-white/80 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <GlassCard key={step.number} className="p-6">
                <span className="text-5xl font-bold text-white/20">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold mt-4 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {step.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who Is It For ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Built for creative professionals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {whoIsItFor.map((item) => (
              <GlassCard key={item.title} variant="subtle" className="p-6 text-center">
                <item.icon className="h-10 w-10 mx-auto text-white/80 mb-4" />
                <h3 className="text-base font-semibold">{item.title}</h3>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <GlassCard
                key={faq.question}
                variant="subtle"
                className="overflow-hidden"
              >
                <button
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-white/50 transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 pt-0">
                    <p className="text-sm text-white/50 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <GlassCard className="mx-auto max-w-4xl text-center p-12 md:p-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to streamline your workflow?
          </h2>
          <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto">
            Join creative professionals who manage their clients, projects, and
            deliveries from one workspace.
          </p>
          <Button className="bg-white text-[#0B132B] hover:bg-white/90 px-10 py-6 text-base">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </GlassCard>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <a href="/" className="flex items-center gap-2 text-xl font-bold mb-3">
                <VideoIcon className="h-5 w-5" />
                ClientRegit
              </a>
              <p className="text-sm text-white/40">
                Manage clients. Deliver better work.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
                Product
              </h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "FAQ"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
                Resources
              </h4>
              <ul className="space-y-3">
                {["Help", "Blog"].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-white/40 hover:text-white transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
                Legal
              </h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms & Conditions", "Cookie Policy"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-sm text-white/40 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-xs text-white/30">
              &copy; 2026 ClientRegit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}