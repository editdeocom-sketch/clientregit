"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Logo } from "@/components/layout/logo"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { cn } from "@/lib/utils"

function validatePassword(pw: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (pw.length < 6) errors.push("At least 6 characters")
  if (pw.length > 10) errors.push("Max 10 characters")
  if (!/[A-Z]/.test(pw)) errors.push("At least one uppercase letter")
  if (!/[a-z]/.test(pw)) errors.push("At least one lowercase letter")
  if (!/[0-9]/.test(pw)) errors.push("At least one number")
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) errors.push("At least one symbol")
  return { valid: errors.length === 0, errors }
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met ? (
        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
      ) : (
        <XCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
      )}
      <span className={cn("transition-colors", met ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
        {text}
      </span>
    </div>
  )
}

function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const pwValidation = validatePassword(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!pwValidation.valid) {
      toast.error("Password does not meet requirements.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)

    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card/60 backdrop-blur-lg border border-border rounded-2xl p-8 text-center">
          <div className="flex flex-col items-center mb-6">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h1 className="text-xl font-bold mb-2 text-foreground">Password updated</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your password has been successfully updated. Redirecting to sign in...
            </p>
          </div>
          <Link href="/login">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11">
              Sign In Now
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card/60 backdrop-blur-lg border border-border rounded-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-2">
            <Logo size="md" />
          </div>
          <p className="text-sm text-muted-foreground">Set your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
            {password.length > 0 && (
              <div className="space-y-1 mt-2">
                <PasswordRequirement met={password.length >= 6 && password.length <= 10} text="6-10 characters" />
                <PasswordRequirement met={/[A-Z]/.test(password)} text="One uppercase letter" />
                <PasswordRequirement met={/[a-z]/.test(password)} text="One lowercase letter" />
                <PasswordRequirement met={/[0-9]/.test(password)} text="One number" />
                <PasswordRequirement met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)} text="One symbol" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs mt-1">
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-green-600 dark:text-green-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !pwValidation.valid || !passwordsMatch}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Update Password"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-foreground/80 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <UpdatePasswordForm />
    </Suspense>
  )
}
