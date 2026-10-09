import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ActivationScreen } from './ActivationScreen'
import { api, type LicenseState } from '@/lib/api'
import { useApi } from '@/lib/hooks'

export function LicenseGate({ children }: { children: ReactNode }): ReactNode {
  const { data: state, loading, error, reload } = useApi<LicenseState>(
    () => api.license.getState(),
    []
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading…
      </div>
    )
  }

  if (!state) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <img src="/logo-emblem.png" alt="ClientRegit" className="h-12 w-12 object-contain" />
        <p className="max-w-sm text-sm text-muted">
          {error ?? 'Could not check the license status.'}
        </p>
        <Button variant="secondary" onClick={reload}>
          Try again
        </Button>
      </div>
    )
  }

  if (state.status === 'trial' || state.status === 'activated') {
    return children
  }

  return <ActivationScreen state={state} onActivated={() => reload()} />
}
