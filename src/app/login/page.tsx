"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
  }

  return (
    <div className="w-full max-w-md bg-[#141E3A]/60 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
      <div className="flex flex-col items-center mb-8">
        <div className="mb-2">
          <Logo size="md" />
        </div>
        <p className="text-sm text-white/50">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-[#0B132B] hover:bg-white/90 h-11"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-white hover:text-white/80 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B132B] px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-white/50" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}