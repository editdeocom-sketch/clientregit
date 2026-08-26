import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { CookieConsent } from "@/components/marketing/cookie-consent"

export const metadata = {
  title: "Privacy Policy",
  description: "ClientRegit's privacy policy. Learn how we collect, use, and protect your data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />

      <section className="relative pt-32 pb-16 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: August 2026</p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto max-w-3xl space-y-12">
          <p className="text-muted-foreground leading-relaxed">
            At ClientRegit, we take your privacy seriously. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our platform. Please
            read this policy carefully to understand our practices regarding your data.
          </p>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Information We Collect</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                We collect information that you provide directly to us, including your name, email
                address, and payment information when you create an account or subscribe to our
                service.
              </p>
              <p>
                We also collect usage data automatically when you interact with our platform, such as
                your IP address, browser type, device information, pages visited, and actions taken
                within the application.
              </p>
              <p>
                When you upload content such as videos, documents, or project files, we store that
                content on our servers to provide the service to you.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">How We Use Your Information</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activity patterns</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Data Storage</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Your data is stored on secure servers provided by our hosting infrastructure
                partners. We use industry-standard encryption protocols to protect data in transit
                and at rest.
              </p>
              <p>
                We retain your personal information only for as long as necessary to provide you
                with our services and as described in this policy. When you delete your account, we
                will delete or anonymize your personal data within 30 days.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Cookies</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                We use cookies and similar tracking technologies to maintain your session, remember
                your preferences, and analyze how our platform is used.
              </p>
              <p>
                Essential cookies are necessary for the platform to function. Analytics cookies help
                us understand how visitors interact with our website. You can control cookie
                preferences through your browser settings.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Third-Party Services</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                We may use third-party services to facilitate our service, provide the service on
                our behalf, or perform service-related functions. These third parties have access to
                your personal information only to perform these tasks on our behalf and are obligated
                not to disclose or use it for any other purpose.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Data Security</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                We implement appropriate technical and organizational measures to protect your
                personal information against unauthorized access, alteration, disclosure, or
                destruction. However, no method of transmission over the Internet or electronic
                storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Rights</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Changes to This Policy</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new policy on this page and updating the &quot;Last updated&quot;
                date. You are advised to review this policy periodically for any changes.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Contact</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
                <a href="mailto:hello@clientregit.com" className="text-foreground hover:underline">
                  hello@clientregit.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <CookieConsent />
    </div>
  )
}
