"use client"

import { useState } from "react"
import Link from "next/link"
import { VideoIcon, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
  { label: "Blog", href: "/#blog" },
]

export function MarketingNavbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B132B]/80 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <VideoIcon className="h-6 w-6 text-white" />
          ClientRegit
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white/70 hover:text-white">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-white text-[#0B132B] hover:bg-white/90">
              Get Started
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden text-white/70 hover:text-white"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          {mobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#0B132B]/95 backdrop-blur-md px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block text-sm text-white/70 hover:text-white transition-colors"
              onClick={() => setMobileNavOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            <Link href="/login" className="w-full">
              <Button variant="ghost" className="text-white/70 hover:text-white w-full">
                Login
              </Button>
            </Link>
            <Link href="/signup" className="w-full">
              <Button className="bg-white text-[#0B132B] hover:bg-white/90 w-full">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
