import { useEffect, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { api, fmtDate, type LicenseState, type UserProfile } from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { toast } from '@/store/ui'

function Row({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="min-w-0 truncate font-medium text-ink">{children}</span>
    </div>
  )
}

export function ProfilePage(): ReactNode {
  const { data: user, loading, reload } = useApi<UserProfile | null>(() => api.user.get(), [])
  const { data: license } = useApi<LicenseState>(() => api.license.getState(), [])

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name)
      setPhone(user.phone)
    }
  }, [user])

  const saveDetails = async (): Promise<void> => {
    setSavingDetails(true)
    try {
      await api.user.updateProfile({ full_name: fullName, phone })
      toast.success('Profile updated')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingDetails(false)
    }
  }

  const savePassword = async (): Promise<void> => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setSavingPassword(true)
    try {
      await api.user.changePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted">Loading profile…</div>
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="Profile" subtitle="Your account details" />
        <Card>
          <div className="px-5 py-4 text-sm text-muted">
            You are not signed in. Sign in with your account to view and update your details.
          </div>
        </Card>
      </div>
    )
  }

  const initial = (user.full_name || user.email || '?').trim().charAt(0).toUpperCase() || '?'

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account details" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account" subtitle="Signed-in user" />
          <div className="space-y-3 px-5 py-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-base font-semibold text-gold-strong dark:text-gold">
                {initial}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium text-ink">
                  {user.full_name || (user.email ?? '—')}
                </div>
                <div className="truncate text-xs text-muted">{user.email ?? '—'}</div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
              <span className="text-muted">Email status</span>
              {user.email_confirmed ? (
                <Badge tone="success">Confirmed</Badge>
              ) : (
                <Badge tone="warn">Unconfirmed</Badge>
              )}
            </div>
            <Row label="Member since">{fmtDate(user.created_at)}</Row>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted">User ID</span>
              <span className="min-w-0 break-all font-mono text-right text-xs text-ink">
                {user.id}
              </span>
            </div>
          </div>
        </Card>

        {license && (
          <Card>
            <CardHeader title="Plan" subtitle="Current license" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Status</span>
                {license.status === 'activated' ? (
                  <Badge tone="success">
                    {license.license_type === 'subscription' ? 'Subscription' : 'Activated'}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Trial</Badge>
                )}
              </div>
              <Row label="Account">{license.email ?? '—'}</Row>
              {license.is_team && (
                <Row label="Seats">
                  {license.seats_used ?? 0} of {license.seats ?? '?'} used
                </Row>
              )}
              {license.license_key && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">License key</span>
                  <span className="min-w-0 truncate font-mono text-xs tracking-wider text-ink">
                    {license.license_key}
                  </span>
                </div>
              )}
              <Row label="Renews">
                {license.license_expires_at ? fmtDate(license.license_expires_at) : '—'}
              </Row>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader title="Your details" subtitle="Personal details for your account" />
          <div className="space-y-4 px-5 py-4">
            <Field label="Full name">
              <Input
                value={fullName}
                placeholder="Your name"
                onChange={(event) => setFullName(event.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={phone}
                placeholder="Phone number"
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <div className="flex justify-end">
              <Button variant="primary" disabled={savingDetails} onClick={() => void saveDetails()}>
                {savingDetails ? 'Saving…' : 'Save details'}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Change password" subtitle="At least 8 characters" />
          <div className="space-y-4 px-5 py-4">
            <Field label="New password">
              <Input
                type="password"
                value={newPassword}
                placeholder="New password"
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                value={confirmPassword}
                placeholder="Repeat new password"
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </Field>
            <div className="flex justify-end">
              <Button
                variant="primary"
                disabled={savingPassword}
                onClick={() => void savePassword()}
              >
                {savingPassword ? 'Updating…' : 'Change password'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
