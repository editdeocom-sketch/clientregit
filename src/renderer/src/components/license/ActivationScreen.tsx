import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { api, type LicenseState } from '@/lib/api'

interface ActivationScreenProps {
  state: LicenseState
  onActivated: (state: LicenseState) => void
}

const COPY: Record<string, { title: string; subtitle: string }> = {
  trial_expired: {
    title: 'Your free trial has ended',
    subtitle:
      'You had 7 full days to try every feature. Sign in with your account, then enter your license key to keep using ClientRegit.'
  },
  license_expired: {
    title: 'Your license has expired',
    subtitle:
      'Sign in again to activate a renewed license, or open the website to buy a new plan.'
  }
}

export function ActivationScreen({ state, onActivated }: ActivationScreenProps): ReactNode {
  const [step, setStep] = useState<'signin' | 'key'>('signin')
  const [email, setEmail] = useState(state.email ?? '')
  const [password, setPassword] = useState('')
  const [signedInAs, setSignedInAs] = useState<string | null>(null)
  const [licenseKey, setLicenseKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = COPY[state.status] ?? {
    title: 'Activate ClientRegit',
    subtitle: 'Sign in with your account, then enter your license key.'
  }

  const submitSignIn = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const result = await api.license.signIn({ email, password })
      setSignedInAs(result.email)
      setStep('key')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const submitKey = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const next = await api.license.activate({ licenseKey })
      onActivated(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const backToSignIn = (): void => {
    setStep('signin')
    setPassword('')
    setSignedInAs(null)
    setError(null)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-emblem.png" alt="ClientRegit" className="mb-3 h-14 w-14 object-contain" />
          <h1 className="text-lg font-semibold tracking-tight">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted">{copy.subtitle}</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            void (step === 'signin' ? submitSignIn() : submitKey())
          }}
        >
          {step === 'signin' ? (
            <>
              <Field label="Email" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Password" required>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your account password"
                  autoComplete="current-password"
                />
              </Field>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border border-line bg-canvas px-3 py-2 text-sm">
                <span className="truncate text-muted">Signed in as</span>
                <span className="ml-2 truncate font-medium text-ink">{signedInAs}</span>
              </div>
              <button
                type="button"
                onClick={backToSignIn}
                className="cursor-pointer text-xs font-semibold text-gold-strong hover:underline"
              >
                Use a different account
              </button>
              <Field label="License key" required hint="From your account page after purchase">
                <Input
                  value={licenseKey}
                  onChange={(event) => setLicenseKey(event.target.value.toUpperCase())}
                  placeholder="CRIT-XXXX-XXXX-XXXX-XXXX"
                  className="font-mono tracking-wider"
                />
              </Field>
            </>
          )}

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {step === 'signin'
              ? busy
                ? 'Signing in…'
                : 'Sign in'
              : busy
                ? 'Verifying…'
                : 'Verify & unlock'}
          </Button>
        </form>

        {state.site_url && (
          <div className="mt-5 space-y-2 border-t border-line pt-5">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => void api.files.openExternal(state.site_url)}
            >
              Buy a license
            </Button>
            <p className="text-center text-xs text-muted">
              No account yet? Buy on the website — your key appears in your account.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
