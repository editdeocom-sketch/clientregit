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

export function RefundPolicyPage() {
  return <MarketingContentPage title="Refund Policy" description="How refunds work for ClientRegit subscriptions and purchases.">
    <h2 className="text-2xl font-bold text-foreground">Recurring Subscriptions</h2>
    <p>You may cancel your recurring subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. You will retain access to paid features until the period expires.</p>
    <p>Refunds for recurring subscriptions are generally not provided for partial billing periods. If you believe a charge was made in error, contact our support team within 7 days of the charge.</p>
    <h2 className="text-2xl font-bold text-foreground">Lifetime Purchases</h2>
    <p>Lifetime access purchases are eligible for a refund within 14 days of purchase, provided you have not substantially used the service. Contact support to request a refund.</p>
    <h2 className="text-2xl font-bold text-foreground">Duplicate Payments</h2>
    <p>If you were charged multiple times for the same purchase, contact us immediately. We will investigate and process a refund for any verified duplicate charges.</p>
    <h2 className="text-2xl font-bold text-foreground">Failed Payments</h2>
    <p>Failed payment attempts do not result in charges. If you see a pending charge that was not completed, it will typically be released by your bank within 3-5 business days.</p>
    <h2 className="text-2xl font-bold text-foreground">Contact</h2>
    <p>To request a refund or discuss a payment issue, email <a href="mailto:support@clientregit.com" className="text-primary underline">support@clientregit.com</a> with your account email and a description of the issue.</p>
  </MarketingContentPage>
}

export function AcceptableUsePage() {
  return <MarketingContentPage title="Acceptable Use Policy" description="Guidelines for using ClientRegit responsibly and lawfully.">
    <h2 className="text-2xl font-bold text-foreground">Prohibited Activities</h2>
    <p>You agree not to use ClientRegit to:</p>
    <ul className="list-disc pl-6 space-y-2">
      <li>Store or share content that violates any applicable law or regulation</li>
      <li>Infringe upon the intellectual property rights of others, including copyright, trademark, or trade secret violations</li>
      <li>Distribute malware, viruses, or any code designed to disrupt, damage, or gain unauthorized access to systems</li>
      <li>Engage in fraudulent activity, including misrepresenting your identity or affiliation</li>
      <li>Send spam, unsolicited communications, or phishing attempts</li>
      <li>Harass, threaten, or abuse other users or individuals</li>
      <li>Attempt to gain unauthorized access to other users' accounts, data, or the application infrastructure</li>
      <li>Abuse payment systems, including issuing chargebacks for legitimate charges or exploiting coupon systems</li>
      <li>Use storage in excess of your plan limits or attempt to circumvent usage restrictions</li>
      <li>Access or attempt to access another user's private data, files, or account information</li>
      <li>Use automated tools to scrape, crawl, or excessively load the application</li>
      <li>Reverse engineer, decompile, or attempt to extract the source code of the application</li>
    </ul>
    <h2 className="text-2xl font-bold text-foreground">Content Responsibility</h2>
    <p>You are solely responsible for the content you store and share through ClientRegit. This includes client information, project details, videos, and invoices. Ensure you have the right to store and process all data you upload.</p>
    <h2 className="text-2xl font-bold text-foreground">Enforcement</h2>
    <p>We reserve the right to suspend or terminate accounts that violate this policy. We may also report illegal activity to law enforcement authorities when required.</p>
  </MarketingContentPage>
}

export function SecurityPage() {
  return <MarketingContentPage title="Security" description="How ClientRegit protects your data and accounts.">
    <h2 className="text-2xl font-bold text-foreground">Authentication</h2>
    <p>ClientRegit uses secure password hashing (bcrypt) and JSON Web Tokens (JWT) for session management. Passwords are never stored in plain text. Session tokens expire after 30 days.</p>
    <h2 className="text-2xl font-bold text-foreground">Authorization</h2>
    <p>Every API request is authenticated and authorized. Users can only access their own data. Administrative access requires an explicit admin role assigned by another administrator.</p>
    <h2 className="text-2xl font-bold text-foreground">Payment Security</h2>
    <p>Payments are processed through Razorpay, a PCI DSS compliant payment processor. ClientRegit never stores your credit card information. All payment verification is done server-side.</p>
    <h2 className="text-2xl font-bold text-foreground">Data Protection</h2>
    <p>Application data is stored in a local SQLite database. File uploads are stored locally with authentication-gated access. We recommend keeping regular backups of your database and uploaded files.</p>
    <h2 className="text-2xl font-bold text-foreground">Private File Access</h2>
    <p>Uploaded videos and files are protected behind authentication. Files cannot be accessed by guessing URLs. Only the account owner and authorized administrators can access private files.</p>
    <h2 className="text-2xl font-bold text-foreground">Security Reporting</h2>
    <p>If you discover a security vulnerability, please report it responsibly by emailing <a href="mailto:security@clientregit.com" className="text-primary underline">security@clientregit.com</a>. We will investigate all reports promptly.</p>
  </MarketingContentPage>
}

export function AdvertisingPolicyPage() {
  return <MarketingContentPage title="Advertising Policy" description="How advertising may appear on ClientRegit public pages.">
    <h2 className="text-2xl font-bold text-foreground">Third-Party Advertising</h2>
    <p>ClientRegit may display advertisements on public-facing pages such as the homepage, features page, and FAQ. These advertisements are served by third-party advertising networks, including Google AdSense.</p>
    <h2 className="text-2xl font-bold text-foreground">Cookie Usage</h2>
    <p>Third-party advertisers may use cookies or similar technologies to serve relevant ads. These cookies are subject to the advertising partner's own privacy policy. You can manage your advertising preferences through our cookie consent tool.</p>
    <h2 className="text-2xl font-bold text-foreground">No Encouragement to Click</h2>
    <p>We do not encourage users to click on advertisements. Advertising does not influence our editorial decisions, service features, or pricing. Ads are clearly distinguishable from our own content.</p>
    <h2 className="text-2xl font-bold text-foreground">Ad-Free Areas</h2>
    <p>Advertisements do not appear on authenticated application pages, billing screens, or private user content areas. Ads are limited to public informational pages.</p>
    <h2 className="text-2xl font-bold text-foreground">Contact</h2>
    <p>Questions about our advertising practices can be directed to <a href="mailto:support@clientregit.com" className="text-primary underline">support@clientregit.com</a>.</p>
  </MarketingContentPage>
}
