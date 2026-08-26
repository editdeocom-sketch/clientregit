import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { CookieConsent } from "@/components/marketing/cookie-consent"

export const metadata = {
  title: "Terms & Conditions",
  description: "ClientRegit's terms and conditions. Read about the rules governing your use of our platform.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B132B] text-white">
      <MarketingNavbar />

      <section className="relative pt-32 pb-16 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms & Conditions</h1>
          <p className="text-white/50">Last updated: August 2026</p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto max-w-3xl space-y-12">
          <p className="text-white/60 leading-relaxed">
            Welcome to ClientRegit. By accessing or using our platform, you agree to be bound by
            these Terms and Conditions. If you do not agree with any part of these terms, you may
            not access the service.
          </p>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                By creating an account or using ClientRegit, you acknowledge that you have read,
                understood, and agree to be bound by these Terms and Conditions and our Privacy
                Policy. These terms apply to all users of the service, including browsers, customers,
                merchants, and content contributors.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">2. Account Responsibility</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                You are responsible for safeguarding your account credentials and for all activities
                that occur under your account. You must notify us immediately of any unauthorized use
                of your account. We are not liable for any loss arising from unauthorized use of your
                account.
              </p>
              <p>
                You must be at least 18 years of age to create an account and use our service. You
                agree to provide accurate, current, and complete information during registration and
                to update such information as necessary.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">3. Acceptable Use</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>You agree not to use ClientRegit to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others, including intellectual property rights</li>
                <li>Upload malicious content or attempt to disrupt the service</li>
                <li>Attempt to gain unauthorized access to other users&apos; accounts or our systems</li>
                <li>Use the service for any fraudulent or illegal purpose</li>
                <li>Transmit spam, chain letters, or other unsolicited communications</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">4. User Content</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                You retain ownership of all content you upload to ClientRegit, including videos,
                documents, and project files. By uploading content, you grant us a limited license to
                host, store, and display that content solely for the purpose of providing the service
                to you.
              </p>
              <p>
                You are solely responsible for the content you upload and must ensure you have the
                necessary rights and permissions for all content shared through our platform.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">5. Intellectual Property</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                The ClientRegit platform, including its design, code, features, and branding, is the
                intellectual property of ClientRegit and is protected by copyright, trademark, and
                other laws. You may not copy, modify, distribute, or reverse-engineer any part of our
                service without our express written consent.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">6. Service Availability</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                We strive to maintain high availability of our service, but we do not guarantee
                uninterrupted access. We may temporarily suspend or restrict access to the service
                for maintenance, updates, or circumstances beyond our reasonable control.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the service at
                any time with reasonable notice. We will not be liable for any modification,
                suspension, or discontinuation of the service.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">7. Account Termination</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                You may terminate your account at any time by contacting us or using the account
                deletion feature. We reserve the right to suspend or terminate your account if you
                violate these terms or engage in activity that we reasonably believe is harmful to
                other users or the service.
              </p>
              <p>
                Upon termination, your right to use the service ceases immediately. We will make your
                data available for export for a reasonable period following termination.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                To the maximum extent permitted by law, ClientRegit shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or any loss of
                profits or revenues, whether incurred directly or indirectly, or any loss of data,
                use, goodwill, or other intangible losses resulting from your use of the service.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">9. Changes to Service</h2>
            <div className="text-white/60 leading-relaxed space-y-4">
              <p>
                We reserve the right to update, modify, or change our service and these terms at any
                time. We will notify you of any material changes by posting the new terms on this
                page and updating the &quot;Last updated&quot; date. Your continued use of the service after
                any changes constitutes acceptance of the new terms.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-white/10">
            <p className="text-white/40 text-sm">
              If you have any questions about these Terms & Conditions, please contact us at{" "}
              <a href="mailto:hello@clientregit.com" className="text-white/60 hover:text-white transition-colors">
                hello@clientregit.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <CookieConsent />
    </div>
  )
}