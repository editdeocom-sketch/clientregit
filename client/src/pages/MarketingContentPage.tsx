import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"

interface MarketingContentPageProps {
  title: string
  description: string
  children: React.ReactNode
}

export function MarketingContentPage({ title, description, children }: MarketingContentPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />
      <main className="mx-auto max-w-4xl px-6 pb-20 pt-36">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">ClientRegit</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{description}</p>
        <div className="mt-10 space-y-8 text-muted-foreground leading-7">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  )
}

export function AboutPage() {
  return <MarketingContentPage title="About ClientRegit" description="A focused workspace for creative professionals who want simpler client operations.">
    <p>ClientRegit brings clients, projects, video reviews, revisions, approvals, tasks, and invoices into one calm workspace.</p>
    <p>It is designed for independent video editors, freelancers, and small creative teams who want to spend less time chasing updates and more time delivering excellent work.</p>
  </MarketingContentPage>
}

export function ContactPage() {
  return <MarketingContentPage title="Contact Us" description="Have a question about ClientRegit? We are here to help.">
    <p>For product questions, account support, or feedback, contact the ClientRegit team by email.</p>
    <a className="inline-flex rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90" href="mailto:support@clientregit.com">Email support@clientregit.com</a>
  </MarketingContentPage>
}

export function PrivacyPage() {
  return <MarketingContentPage title="Privacy Policy" description="How ClientRegit handles information in the local-first application.">
    <p>ClientRegit stores application data in the local SQLite database configured by the application owner. The application does not require a hosted database for normal local use.</p>
    <p>Keep your local database, backups, authentication secret, and uploaded media secure. Do not share them publicly.</p>
  </MarketingContentPage>
}

export function TermsPage() {
  return <MarketingContentPage title="Terms and Conditions" description="The terms for using ClientRegit responsibly.">
    <p>Use ClientRegit only with information you are authorized to manage. You are responsible for protecting your account credentials, local database, backups, and uploaded files.</p>
    <p>Always maintain a current backup before making major changes or moving the application between hosts.</p>
  </MarketingContentPage>
}

export function CookiesPage() {
  return <MarketingContentPage title="Cookie Policy" description="Information about browser storage used by ClientRegit.">
    <p>ClientRegit uses essential browser storage for authentication tokens, theme preference, and application preferences. These values are required for the local application to remember your session and settings.</p>
  </MarketingContentPage>
}
