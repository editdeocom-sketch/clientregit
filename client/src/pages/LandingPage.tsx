import { useState, useEffect } from "react";
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
  Moon,
  Sun,
  Check,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/layout/glass-card";
import { Logo } from "@/components/layout/logo";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Users,
    title: "Client Management",
    description: "Keep client information organized in one place. Track contacts, projects, and history effortlessly.",
  },
  {
    icon: FolderKanban,
    title: "Project Management",
    description: "Track projects, deadlines and progress from start to finish with visual boards.",
  },
  {
    icon: Video,
    title: "Video Reviews",
    description: "Share videos and collect timestamped feedback from clients in real-time.",
  },
  {
    icon: RefreshCw,
    title: "Revision Tracking",
    description: "Turn client feedback into actionable revisions quickly. Never miss a comment.",
  },
  {
    icon: CheckCircle,
    title: "Client Approvals",
    description: "Let clients approve completed versions with one click. Simple and clear.",
  },
  {
    icon: FileText,
    title: "Invoice Tracking",
    description: "Track invoices and payment status for every project. Get paid on time.",
  },
];

const steps = [
  {
    number: "01",
    title: "Add your client",
    description: "Import or create a client profile in seconds. Keep all their info organized.",
  },
  {
    number: "02",
    title: "Create a project",
    description: "Set up a project, upload assets and invite your client to collaborate.",
  },
  {
    number: "03",
    title: "Share and review videos",
    description: "Send video links and collect timestamped feedback from your clients.",
  },
  {
    number: "04",
    title: "Get approval and deliver",
    description: "Clients approve the final version with one click. Project complete!",
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
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Blog", href: "/blog" },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={false} />
            <span className="ml-2 text-lg font-bold tracking-tight text-foreground">
              Client<span className="text-muted-foreground">Regit</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <Link to="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            )}
            <button
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-border bg-card px-6 py-4 space-y-1 animate-slide-up">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block px-2 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link to="/signup" className="block">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="mx-auto max-w-4xl text-center px-6">
          <Badge variant="secondary" className="mb-5">
            Built for creative professionals
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight mb-5">
            Manage clients.
            <br />
            Deliver better work.
          </h1>
          <p className="mx-auto max-w-xl text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
            ClientRegit helps creative professionals manage clients, projects,
            video reviews, revisions and invoices from one simple workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Product preview */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="h-3 w-3 rounded-full bg-muted" />
              <span className="ml-3 text-xs text-muted-foreground">
                brxstudios.clientregit.app — Client Workspace
              </span>
            </div>
            <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[180px_1fr]">
              <div className="hidden sm:flex flex-col gap-2 border-r border-border p-4">
                {["Dashboard", "Projects", "Videos", "Invoices"].map((label, i) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                      i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <span className="h-3 w-3 rounded bg-current opacity-60" />
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 sm:p-6">
                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="h-4 w-40 rounded bg-muted" />
                      <div className="mt-1.5 h-2.5 w-52 rounded bg-muted/60" />
                    </div>
                    <div className="h-8 w-24 rounded-lg bg-primary/15" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[0, 1].map((row) =>
                      [0, 1].map((col) => (
                        <div
                          key={`${row}-${col}`}
                          className="rounded-lg border border-border/60 p-3"
                        >
                          <div className="h-2.5 w-16 rounded bg-muted/70" />
                          <div className="mt-2 h-6 w-24 rounded bg-primary/10" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-2 rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Review — Episode 42
                    </span>
                    <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
                      Approved
                    </span>
                  </div>
                  <div className="aspect-video rounded-md bg-muted/50" />
                  <div className="h-2 w-full rounded bg-muted/70" />
                  <div className="h-2 w-3/4 rounded bg-muted/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section id="product" className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GlassCard className="p-6 h-full">
              <Badge variant="secondary" className="mb-4">
                The problem
              </Badge>
              <h2 className="text-2xl font-bold mb-4">Creative work is scattered</h2>
              <ul className="space-y-4">
                {[
                  "Sending videos back and forth over email and chats, losing feedback.",
                  "No single source of truth for which version is approved.",
                  "Invoices chased across spreadsheets, DMs, and half-remembered promises.",
                ].map((pain) => (
                  <li key={pain} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                    {pain}
                  </li>
                ))}
              </ul>
            </GlassCard>

            <GlassCard variant="strong" className="p-6 h-full">
              <Badge className="mb-4 bg-primary/15 text-primary border-0">
                ClientRegit's solution
              </Badge>
              <h2 className="text-2xl font-bold mb-4">One calm, organized workspace</h2>
              <ul className="space-y-4">
                {[
                  "Timestamped video reviews, so feedback lands exactly where it matters.",
                  "Clear approval states and version history — everyone knows what's final.",
                  "Invoices generated, shared, and tracked in minutes from the same dashboard.",
                ].map((sol) => (
                  <li key={sol} className="flex items-start gap-3 text-sm text-foreground">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    {sol}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Everything you need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for creative professionals
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <GlassCard
                key={feature.title}
                className="p-5 group transition-colors hover:border-primary/30 h-full"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple workflow
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step) => (
              <GlassCard key={step.number} className="p-5 h-full">
                <span className="text-3xl font-bold text-primary/40">{step.number}</span>
                <h3 className="text-sm font-semibold mt-3 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Built for creative professionals</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you work alone or with a team, ClientRegit scales with you
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {whoIsItFor.map((item) => (
              <GlassCard
                key={item.title}
                variant="subtle"
                className="p-4 text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section id="pricing" className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start for free, upgrade when you need more
            </p>
          </div>
          <div className="text-center">
            <Link to="/pricing">
              <Button size="lg">
                View Pricing & Plans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Free plan available. Pro from ₹599/month. Lifetime from ₹10,999.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Frequently asked questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about ClientRegit
            </p>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <GlassCard
                key={faq.question}
                className="overflow-hidden"
              >
                <button
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  aria-expanded={openFaq === index}
                >
                  <span className="text-sm font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{
                    maxHeight: openFaq === index ? "200px" : "0",
                    opacity: openFaq === index ? 1 : 0,
                  }}
                >
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <GlassCard className="mx-auto max-w-4xl text-center p-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Ready to streamline your workflow?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join creative professionals who manage their clients, projects, and
            deliveries from one workspace.
          </p>
          <Link to="/signup">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </GlassCard>
      </section>

      <MarketingFooter />
    </div>
  );
}