import { MarketingNavbar } from "@/components/marketing/navbar"
import { MarketingFooter } from "@/components/marketing/footer"
import { CookieConsent } from "@/components/marketing/cookie-consent"

export const metadata = {
  title: "Cookie Policy",
  description: "ClientRegit's cookie policy. Learn about how we use cookies and tracking technologies.",
}

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNavbar />

      <section className="relative pt-32 pb-16 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: August 2026</p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="mx-auto max-w-3xl space-y-12">
          <p className="text-muted-foreground leading-relaxed">
            This Cookie Policy explains how ClientRegit uses cookies and similar technologies to
            recognize you when you visit our website and platform. It explains what these
            technologies are and why we use them, as well as your rights to control our use of them.
          </p>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">What Are Cookies</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Cookies are small data files that are placed on your computer or mobile device when
                you visit a website. Cookies are widely used by website owners to make their
                websites work, or to work more efficiently, as well as to provide reporting
                information.
              </p>
              <p>
                Cookies set by the website owner (in this case, ClientRegit) are called
                &quot;first-party cookies.&quot; Cookies set by parties other than the website owner are
                called &quot;third-party cookies.&quot; Third-party cookies enable features or
                functionality provided by external services.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Necessary Cookies</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                These cookies are essential for the operation of our platform. They enable core
                functionality such as security, account authentication, and session management.
                Without these cookies, services you have asked for cannot be provided.
              </p>
              <p>Examples include:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Session cookies that keep you logged in as you navigate the platform</li>
                <li>Security cookies that help protect against unauthorized access</li>
                <li>Load-balancing cookies that ensure the service remains responsive</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Analytics Cookies</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                These cookies allow us to count visits and traffic sources so we can measure and
                improve the performance of our platform. They help us understand which pages are the
                most and least popular and see how visitors move around the site.
              </p>
              <p>
                All information these cookies collect is aggregated and therefore anonymous. If you
                do not allow these cookies, we will not know when you have visited our site.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Advertising Cookies</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                These cookies may be set through our site by our advertising partners. They may be
                used by those companies to build a profile of your interests and show you relevant
                advertisements on other sites. They do not directly store personal information but
                are based on uniquely identifying your browser and internet device.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Managing Cookies</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                You can set your browser to refuse all or some cookies, or to alert you when
                websites set or access cookies. If you disable or refuse cookies, please note that
                some parts of this platform may become inaccessible or not function properly.
              </p>
              <p>
                Most browsers allow you to refuse or delete cookies through their settings menus.
                To find out more about how to control cookie settings, visit your browser&apos;s help
                pages:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Google Chrome</li>
                <li>Mozilla Firefox</li>
                <li>Apple Safari</li>
                <li>Microsoft Edge</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Changes to This Policy</h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                We may update this Cookie Policy from time to time to reflect changes in technology
                or legislation. We will notify you of any significant changes by posting the new
                policy on this page and updating the &quot;Last updated&quot; date. We encourage you to
                review this policy periodically.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-8 border-t border-border">
            <p className="text-muted-foreground text-sm">
              If you have any questions about our use of cookies, please contact us at{" "}
              <a href="mailto:hello@clientregit.com" className="text-muted-foreground hover:text-foreground transition-colors">
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
