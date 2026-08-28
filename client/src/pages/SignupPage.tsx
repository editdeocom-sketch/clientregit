import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { countryOptions, defaultCountry } from "@/lib/countryData";
import { usePreferences } from "@/contexts/PreferencesContext";

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
  const navigate = useNavigate();
  const { register } = useAuth();
  const { updatePreferences } = usePreferences();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState(defaultCountry.name);
  const [phoneCode, setPhoneCode] = useState(defaultCountry.phoneCode);
  const [currency, setCurrency] = useState(defaultCountry.currency);
  const [currencySymbol, setCurrencySymbol] = useState(defaultCountry.symbol);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const fullPhone = phone.trim() ? `${phoneCode} ${phone.trim()}` : "";
    const result = await register(fullName, email, password, "editor", fullPhone);

    if (!result.success) {
      toast.error(result.error || "Registration failed.");
      setLoading(false);
      return;
    }

    try {
      await updatePreferences({ country, currency, currencySymbol, phoneCode });
    } catch {
      toast.error("Account created, but regional preferences could not be saved.");
    }
    toast.success("Account created successfully!");
    navigate("/dashboard");
    setLoading(false);
  }

  const handleCountryChange = (value: string) => {
    const selected = countryOptions.find((item) => item.name === value);
    if (!selected) return;
    setCountry(selected.name);
    setPhoneCode(selected.phoneCode);
    setCurrency(selected.currency);
    setCurrencySymbol(selected.symbol);
  };

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
            <Label htmlFor="country">Country</Label>
            <select
              id="country"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {countryOptions.map((item) => <option key={item.code} value={item.name}>{item.name} ({item.currency})</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input value={phoneCode || "-"} readOnly className="w-20 bg-muted border-border text-foreground" aria-label="Country calling code" />
              <Input
                id="phone"
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s()-]/g, ""))}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">Saved as {phoneCode} plus your phone number.</p>
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
            to="/login"
            className="font-medium text-foreground hover:text-foreground/80"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
