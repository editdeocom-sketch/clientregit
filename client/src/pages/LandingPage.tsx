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
  Star,
  Check,
} from "lucide-react";
import { WaveBackground } from "@/components/layout/wave-background";
import { GlassCard } from "@/components/layout/glass-card";
import { Logo } from "@/components/layout/logo";
import { MarketingFooter } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { AnimatedSection } from "@/hooks/use-in-view";

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

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for freelancers getting started",
    features: [
      "Up to 3 clients",
      "Up to 5 projects",
      "Basic video reviews",
      "Invoice tracking",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Professional",
    price: "INR 999",
    period: "month",
    description: "For growing creative professionals",
    features: [
      "Unlimited clients",
      "Unlimited projects",
      "Advanced video reviews",
      "Priority support",
      "Custom branding",
      "Team collaboration",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "INR 2,999",
    period: "month",
    description: "For creative teams and agencies",
    features: [
      "Everything in Professional",
      "Up to 10 team members",
      "Client portal access",
      "Advanced analytics",
      "API access",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Video Editor",
    content: "ClientRegit has transformed how I work with clients. The video review feature is a game-changer!",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Freelance Designer",
    content: "Finally, a tool that understands creative professionals. The timestamped feedback saves me hours.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Creative Agency Owner",
    content: "Our team's productivity increased by 40% since switching to ClientRegit. Highly recommend!",
    rating: 5,
  },
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border transition-all duration-300">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center">
            <Logo size="sm" showText={false} />
            <span className="ml-2 text-xl font-bold text-foreground">
              Client<span className="text-muted-foreground">Regit</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Link to="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-all duration-200">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover-lift">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md px-6 py-4 space-y-4 animate-slide-up">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground w-full">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center pt-32 pb-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-primary/30 to-transparent blur-3xl pointer-events-none animate-glow" />

        <div className="relative z-10 mx-auto max-w-4xl text-center px-6">
          <Badge variant="secondary" className="mb-6 animate-fade-in delay-100">
            Built for creative professionals
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6 animate-slide-up delay-200">
            Manage clients.
            <br />
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Deliver better work.
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground mb-10 leading-relaxed animate-slide-up delay-300">
            ClientRegit helps creative professionals manage clients, projects,
            video reviews, revisions and invoices from one simple workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-400">
            <Link to="/signup">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base hover-lift transition-all duration-300 group">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                variant="outline"
                className="border-border text-foreground hover:bg-muted px-8 py-6 text-base hover-glow transition-all duration-300"
              >
                See How It Works
              </Button>
            </a>
          </div>
        </div>

        <div className="relative z-10 w-full mt-20">
          <WaveBackground />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Everything you need
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Powerful features designed specifically for creative professionals
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {features.map((feature, i) => (
              <AnimatedSection key={feature.title} delay={i * 80}>
                <GlassCard
                  variant="subtle"
                  className="p-6 hover-lift hover-glow transition-all duration-300 cursor-default group h-full"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-6xl relative z-10">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              How it works
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Get started in minutes with our simple workflow
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {steps.map((step, i) => (
              <AnimatedSection key={step.number} delay={i * 100}>
                <GlassCard className="p-6 hover-lift hover-glow transition-all duration-300 relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full group-hover:from-primary/30 transition-colors duration-300" />
                  <span className="text-5xl font-bold text-primary/30 group-hover:text-primary/50 transition-colors duration-300">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-semibold mt-4 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Built for creative professionals
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Whether you work alone or with a team, ClientRegit scales with you
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 stagger-children">
            {whoIsItFor.map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 80}>
                <GlassCard
                  variant="subtle"
                  className="p-6 text-center hover-lift hover-glow transition-all duration-300 cursor-default group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <item.icon className="h-7 w-7 text-primary group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-6xl relative z-10">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Loved by creative professionals
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              See what our users have to say about ClientRegit
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {testimonials.map((testimonial, i) => (
              <AnimatedSection key={testimonial.name} delay={i * 100}>
                <GlassCard
                  variant="subtle"
                  className="p-6 hover-lift transition-all duration-300 h-full"
                >
                  <div className="flex mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Start for free, upgrade when you need more
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {pricingPlans.map((plan, i) => (
              <AnimatedSection key={plan.name} delay={i * 100}>
                <GlassCard
                  variant={plan.popular ? "default" : "subtle"}
                  className={`p-6 hover-lift transition-all duration-300 relative h-full flex flex-col ${
                    plan.popular ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period !== "forever" && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup" className="block">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
              Frequently asked questions
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              Everything you need to know about ClientRegit
            </p>
          </AnimatedSection>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <AnimatedSection key={faq.question} delay={index * 50}>
                <GlassCard
                  variant="subtle"
                  className="overflow-hidden hover-glow transition-all duration-300"
                >
                  <button
                    className="flex w-full items-center justify-between px-6 py-5 text-left group"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <span className="font-medium group-hover:text-foreground/90 transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ease-out ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{
                      maxHeight: openFaq === index ? "200px" : "0",
                      opacity: openFaq === index ? 1 : 0,
                    }}
                  >
                    <div className="px-6 pb-5 pt-0">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <AnimatedSection>
          <GlassCard className="mx-auto max-w-4xl text-center p-12 md:p-16 relative overflow-hidden group hover-glow transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to streamline your workflow?
              </h2>
              <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                Join creative professionals who manage their clients, projects, and
                deliveries from one workspace.
              </p>
              <Link to="/signup">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 py-6 text-base hover-lift transition-all duration-300 group/btn">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </AnimatedSection>
      </section>

      <MarketingFooter />
    </div>
  );
}
