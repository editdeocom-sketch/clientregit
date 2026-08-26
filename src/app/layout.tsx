import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ClientRegit — Simple Client Management for Creative Professionals",
    template: "%s | ClientRegit",
  },
  description: "ClientRegit helps video editors, freelancers and creative teams manage clients, projects, video reviews, revisions, approvals and invoices in one simple workspace.",
  keywords: [
    "client management for video editors",
    "video editor client management",
    "freelance video editor software",
    "video editing project management",
    "client management software for freelancers",
    "video review software",
    "video revision management",
    "creative freelancer CRM",
    "client portal for video editors",
    "video editing client portal",
  ],
  authors: [{ name: "ClientRegit" }],
  creator: "ClientRegit",
  publisher: "ClientRegit",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clientregit.com",
    siteName: "ClientRegit",
    title: "ClientRegit — Simple Client Management for Creative Professionals",
    description: "ClientRegit helps video editors, freelancers and creative teams manage clients, projects, video reviews, revisions, approvals and invoices in one simple workspace.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClientRegit - Manage clients. Deliver better work.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClientRegit — Simple Client Management for Creative Professionals",
    description: "ClientRegit helps video editors, freelancers and creative teams manage clients, projects, video reviews, revisions, approvals and invoices in one simple workspace.",
    images: ["/og-image.png"],
    creator: "@clientregit",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B132B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-[#0B132B] text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}