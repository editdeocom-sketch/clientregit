"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Mail, Lock } from "lucide-react";
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
  const router = useRouter();

  // Step 1: Email + Password + Role
  // Step 2: OTP verification
  const [step, setStep] = useState<"details" | "otp">("details");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("editor");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [signupLoading, setSignupLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const pwValidation = validatePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSignup = fullName && email && password && confirmPassword && pwValidation.valid && passwordsMatch && !signupLoading;

  // Step 1: Sign up user (creates account + sends OTP)
  async function handleSignup() {
    if (!pwValidation.valid) {
      toast.error("Password does not meet requirements.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSignupLoading(true);
    const supabase = createClient();

    // Sign up - this creates the user and triggers Supabase's email confirmation
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
      setSignupLoading(false);
      return;
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
        role,
      }, { onConflict: "id" });

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      // Check if email confirmation is needed
      if (data.user.identities?.length === 0) {
        // User already exists
        toast.error("An account with this email already exists. Please log in.");
        setSignupLoading(false);
        return;
      }

      // If Supabase sends OTP/magic link, show the OTP step
      // The user will get an email with either a link or OTP code
      toast.success("Account created! Check your email for verification.");
      setStep("otp");
      setResendCountdown(60);
    }

    setSignupLoading(false);
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp() {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setVerifyLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpString,
      type: "signup",
    });

    if (error) {
      toast.error(error.message || "Invalid verification code");
      setVerifyLoading(false);
      return;
    }

    toast.success("Email verified successfully!");
    
    // Redirect based on role
    if (role === "client") {
      router.push("/client/dashboard");
    } else {
      router.push("/dashboard");
    }
    setVerifyLoading(false);
  }

  // Resend OTP
  async function handleResendOtp() {
    if (resendCountdown > 0) return;

    const supabase = createClient();

    // Resend the confirmation email/OTP
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      toast.error("Failed to resend code");
    } else {
      toast.success("New verification code sent!");
      setResendCountdown(60);
    }
  }

  // Countdown timer
  useState(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-card/60 backdrop-blur-lg border border-border rounded-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-2">
            <Logo size="md" />
          </div>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        {/* Step 1: Complete Registration Form */}
        {step === "details" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
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
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="password">Password *</Label>
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
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
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
              onClick={handleSignup}
              disabled={!canSignup}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {signupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground hover:text-foreground/80">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <div className="space-y-5">
            <div className="flex flex-col items-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Enter the 6-digit code sent to
              </p>
              <p className="text-sm font-medium text-foreground mt-1">{email}</p>
            </div>

            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(-1);
                    const newOtp = [...otp];
                    newOtp[index] = val;
                    setOtp(newOtp);
                    if (val && index < 5) {
                      document.getElementById(`otp-${index + 1}`)?.focus();
                    }
                  }}
                  id={`otp-${index}`}
                  className="h-12 w-12 text-center text-lg font-mono bg-muted border-border text-foreground"
                />
              ))}
            </div>

            <Button
              onClick={handleVerifyOtp}
              disabled={otp.join("").length !== 6 || verifyLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            >
              {verifyLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Verify & Complete"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {resendCountdown > 0 ? (
                  `Resend in ${resendCountdown}s`
                ) : (
                  <button onClick={handleResendOtp} className="font-medium text-foreground hover:text-foreground/80">
                    Resend code
                  </button>
                )}
              </p>
            </div>

            <button
              onClick={() => setStep("details")}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mx-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
