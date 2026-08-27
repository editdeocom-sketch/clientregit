"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Mail, CheckCircle } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

type UserRole = "editor" | "client";

function validatePassword(pw: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (pw.length < 6) errors.push("At least 6 characters");
  if (pw.length > 10) errors.push("Max 10 characters");
  if (!/[A-Z]/.test(pw)) errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(pw)) errors.push("At least one lowercase letter");
  if (!/[0-9]/.test(pw)) errors.push("At least one number");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) errors.push("At least one symbol");
  return { valid: errors.length === 0, errors };
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
  );
}

export default function SignupPage() {
  const [step, setStep] = useState<"form" | "check-email">("form");
  const [sentEmail, setSentEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("editor");
  const [loading, setLoading] = useState(false);

  const pwValidation = validatePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = fullName && email && password && confirmPassword && pwValidation.valid && passwordsMatch && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!pwValidation.valid) {
      toast.error("Password does not meet requirements.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Sign up - Supabase sends magic link email automatically
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
        role,
      }, { onConflict: "id" });

      // Show check email page
      setSentEmail(email);
      setStep("check-email");
      toast.success("Verification email sent!");
    }

    setLoading(false);
  }

  // Check email confirmation page
  if (step === "check-email") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-card/60 backdrop-blur-lg border border-border rounded-2xl p-8 text-center">
          <div className="mb-6">
            <Logo size="md" />
          </div>

          <div className="mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Check your email</h1>
            <p className="text-muted-foreground">
              We sent a verification link to
            </p>
            <p className="font-medium text-foreground mt-1">{sentEmail}</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to verify your account and sign in. The link will expire in 24 hours.
              </p>
            </div>

            <Button
              onClick={() => {
                setStep("form");
                setSentEmail("");
              }}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted"
            >
              Use a different email
            </Button>

            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the email?{" "}
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.resend({
                    type: "signup",
                    email: sentEmail,
                  });
                  toast.success("Email resent!");
                }}
                className="font-medium text-foreground hover:text-foreground/80"
              >
                Resend
              </button>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-card/60 backdrop-blur-lg border border-border rounded-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-2">
            <Logo size="md" />
          </div>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted border-border text-foreground"
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
              className="bg-muted border-border text-foreground"
            />
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs mt-1">
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">Passwords match</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 text-red-400" />
                    <span className="text-red-400">Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">I am a…</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="editor">Video Editor</option>
              <option value="client">Client</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-foreground/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
