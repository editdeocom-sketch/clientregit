import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Icon, type IconName } from '@/components/ui/Icon'
import {
  api,
  type AppSettings,
  type BackupTable,
  type LicenseState,
  type SettingsPatch,
  type TeamMember,
  type TeamStatus
} from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { toast, useUi } from '@/store/ui'

const CSV_TABLES: Array<{ table: BackupTable; label: string }> = [
  { table: 'clients', label: 'Clients' },
  { table: 'projects', label: 'Projects' },
  { table: 'invoices', label: 'Invoices' },
  { table: 'invoice_items', label: 'Invoice items' },
  { table: 'payments', label: 'Payments' },
  { table: 'project_files', label: 'Linked files' }
]

export function SettingsPage(): ReactNode {
  const setTheme = useUi((state) => state.setTheme)
  const { data: settings, loading, reload } = useApi(() => api.settings.get(), [])
  const { data: license, reload: reloadLicense } = useApi<LicenseState>(
    () => api.license.getState(),
    []
  )

  const [profile, setProfile] = useState<AppSettings | null>(null)
  const [invoicing, setInvoicing] = useState<AppSettings | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const [showActivate, setShowActivate] = useState(false)
  const [actEmail, setActEmail] = useState('')
  const [actPassword, setActPassword] = useState('')
  const [actKey, setActKey] = useState('')
  const [actBusy, setActBusy] = useState(false)
  const [actError, setActError] = useState<string | null>(null)

  useEffect(() => {
    if (settings) {
      setProfile({ ...settings })
      setInvoicing({ ...settings })
    }
  }, [settings])

  if (loading || !settings || !profile || !invoicing) {
    return <div className="py-20 text-center text-sm text-muted">Loading settings…</div>
  }

  const saveProfile = async (): Promise<void> => {
    const patch: SettingsPatch = {
      business_name: profile.business_name,
      business_tagline: profile.business_tagline,
      business_email: profile.business_email,
      business_phone: profile.business_phone,
      business_address: profile.business_address,
      business_tax_id: profile.business_tax_id
    }
    await persist(patch, 'Business profile saved')
  }

  const saveInvoicing = async (): Promise<void> => {
    const patch: SettingsPatch = {
      currency: invoicing.currency,
      tax_percent: Number(invoicing.tax_percent) || 0,
      invoice_prefix: invoicing.invoice_prefix,
      invoice_next: Number(invoicing.invoice_next) || 1,
      invoice_terms: invoicing.invoice_terms
    }
    await persist(patch, 'Invoicing defaults saved')
  }

  const persist = async (patch: SettingsPatch, message: string): Promise<void> => {
    try {
      await api.settings.patch(patch)
      toast.success(message)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const exportBackup = async (): Promise<void> => {
    try {
      const result = await api.backup.exportJson()
      if (result.path) toast.success(`Backup saved to ${result.path}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const importBackup = async (mode: 'replace' | 'merge'): Promise<void> => {
    try {
      const result = await api.backup.importJson(mode)
      if (!result) return
      const c = result.counts
      toast.success(
        `Imported ${c.clients} clients, ${c.projects} projects, ${c.invoices} invoices`
      )
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const exportCsv = async (table: BackupTable): Promise<void> => {
    try {
      const result = await api.backup.exportCsv(table)
      if (result.path) toast.success(`Saved to ${result.path}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await api.license.deactivate()
      window.location.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const openActivate = (): void => {
    setActEmail(license?.email ?? '')
    setActPassword('')
    setActKey('')
    setActError(null)
    setShowActivate(true)
  }

  const activateNow = async (): Promise<void> => {
    setActBusy(true)
    setActError(null)
    try {
      await api.license.activate({ email: actEmail, password: actPassword, licenseKey: actKey })
      toast.success('License activated')
      window.location.reload()
    } catch (err) {
      setActError(err instanceof Error ? err.message : String(err))
    } finally {
      setActBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Business profile, invoicing and data" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Business profile" subtitle="Shown on invoices" />
          <div className="grid grid-cols-2 gap-4 px-5 py-4">
            <Field label="Business name">
              <Input
                value={profile.business_name}
                onChange={(event) => setProfile({ ...profile, business_name: event.target.value })}
                placeholder="Your studio name"
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={profile.business_tagline}
                onChange={(event) =>
                  setProfile({ ...profile, business_tagline: event.target.value })
                }
                placeholder="Films that feel like memory"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={profile.business_email}
                onChange={(event) => setProfile({ ...profile, business_email: event.target.value })}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={profile.business_phone}
                onChange={(event) => setProfile({ ...profile, business_phone: event.target.value })}
              />
            </Field>
            <Field label="Tax ID / GSTIN">
              <Input
                value={profile.business_tax_id}
                onChange={(event) => setProfile({ ...profile, business_tax_id: event.target.value })}
              />
            </Field>
            <Field label="Address" className="col-span-2">
              <Textarea
                rows={2}
                value={profile.business_address}
                onChange={(event) => setProfile({ ...profile, business_address: event.target.value })}
              />
            </Field>
            <div className="col-span-2 flex justify-end">
              <Button variant="primary" onClick={saveProfile}>
                Save profile
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Invoicing defaults" />
          <div className="grid grid-cols-2 gap-4 px-5 py-4">
            <Field label="Default currency">
              <Select
                value={invoicing.currency}
                onChange={(event) =>
                  setInvoicing({ ...invoicing, currency: event.target.value as AppSettings['currency'] })
                }
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
              </Select>
            </Field>
            <Field label="Tax % (GST / VAT)">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={invoicing.tax_percent}
                onChange={(event) =>
                  setInvoicing({ ...invoicing, tax_percent: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Invoice prefix">
              <Input
                value={invoicing.invoice_prefix}
                onChange={(event) =>
                  setInvoicing({ ...invoicing, invoice_prefix: event.target.value })
                }
                placeholder="INV-"
              />
            </Field>
            <Field label="Next invoice number">
              <Input
                type="number"
                min="1"
                value={invoicing.invoice_next}
                onChange={(event) =>
                  setInvoicing({ ...invoicing, invoice_next: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Default terms" className="col-span-2">
              <Textarea
                rows={3}
                value={invoicing.invoice_terms}
                onChange={(event) =>
                  setInvoicing({ ...invoicing, invoice_terms: event.target.value })
                }
              />
            </Field>
            <div className="col-span-2 flex justify-end">
              <Button variant="primary" onClick={saveInvoicing}>
                Save invoicing
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Appearance" subtitle="Pick your theme" />
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex overflow-hidden rounded-lg border border-line">
              {(['light', 'dark'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={async () => {
                    setTheme(mode)
                    await persist({ theme: mode }, `Switched to ${mode} mode`)
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    settings.theme === mode
                      ? 'bg-gold text-white'
                      : 'bg-surface text-muted hover:text-ink'
                  }`}
                >
                  <Icon name={mode === 'light' ? 'sun' : 'moon'} size={15} />
                  {mode === 'light' ? 'Light' : 'Dark'}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">Saved to your settings</span>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Backup & data"
            subtitle="Your database lives on this PC"
            action={
              <Button
                size="sm"
                variant="ghost"
                icon={<Icon name="folder" size={14} />}
                onClick={() => void api.backup.openDataFolder()}
              >
                Open folder
              </Button>
            }
          />
          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={<Icon name="download" size={15} />} onClick={exportBackup}>
                Export backup
              </Button>
              <Button variant="secondary" icon={<Icon name="upload" size={15} />} onClick={() => importBackup('merge')}>
                Merge from backup
              </Button>
              <Button
                variant="secondary"
                icon={<Icon name="refresh" size={15} />}
                onClick={() => setConfirmRestore(true)}
              >
                Restore (replace all)
              </Button>
            </div>
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Export as CSV
              </p>
              <div className="flex flex-wrap gap-2">
                {CSV_TABLES.map((item) => (
                  <Button
                    key={item.table}
                    size="sm"
                    variant="ghost"
                    icon={<Icon name="file-text" size={14} />}
                    onClick={() => exportCsv(item.table)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="License"
          subtitle="Activation for this computer"
          action={
            license?.status === 'activated' ? (
              <Button size="sm" variant="ghost" onClick={() => void signOut()}>
                Sign out
              </Button>
            ) : license ? (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={openActivate}>
                  Enter license key
                </Button>
                {license.site_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Icon name="external" size={14} />}
                    onClick={() => void api.files.openExternal(license.site_url)}
                  >
                    Buy
                  </Button>
                )}
              </div>
            ) : undefined
          }
        />
        <div className="space-y-2.5 px-5 py-4 text-sm">
          {!license ? (
            <p className="text-muted">Loading license…</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Status</span>
                {license.status === 'trial' && (
                  <Badge tone="gold">
                    Trial — {license.trial_days_left}{' '}
                    {license.trial_days_left === 1 ? 'day' : 'days'} left
                  </Badge>
                )}
                {license.status === 'trial_expired' && <Badge tone="danger">Trial ended</Badge>}
                {license.status === 'activated' && (
                  <Badge tone="success">
                    {license.license_type === 'subscription' && license.license_expires_at
                      ? `Active until ${new Date(license.license_expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                      : license.license_type === 'subscription'
                        ? 'Active'
                        : 'Activated — Lifetime'}
                  </Badge>
                )}
                {license.status === 'license_expired' && <Badge tone="danger">Expired</Badge>}
                {license.status === 'team_online_required' && (
                  <Badge tone="danger">Team check required</Badge>
                )}
                {license.status === 'seat_unavailable' && <Badge tone="danger">No free seat</Badge>}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Account</span>
                <span className="truncate font-medium text-ink">{license.email ?? '—'}</span>
              </div>
              {license.is_team && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Seats</span>
                  <span className="font-medium text-ink">
                    {license.seats_used ?? 0} of {license.seats ?? '?'} used
                  </span>
                </div>
              )}
              {license.license_key && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">License key</span>
                  <span className="font-mono text-xs tracking-wider text-ink">
                    {license.license_key}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted">Trial ends</span>
                <span className="font-medium text-ink">
                  {license.trial_ends_at
                    ? new Date(license.trial_ends_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : '—'}
                </span>
              </div>
            </>
          )}
        </div>

        {showActivate && license && license.status !== 'activated' && (
          <form
            className="space-y-3 border-t border-line px-5 py-4"
            onSubmit={(event) => {
              event.preventDefault()
              void activateNow()
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Activate your license
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Email">
                <Input
                  type="email"
                  value={actEmail}
                  onChange={(event) => setActEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="Password">
                <Input
                  type="password"
                  value={actPassword}
                  onChange={(event) => setActPassword(event.target.value)}
                  placeholder="Your account password"
                />
              </Field>
              <Field label="License key">
                <Input
                  value={actKey}
                  onChange={(event) => setActKey(event.target.value.toUpperCase())}
                  placeholder="CRIT-XXXX-XXXX-XXXX-XXXX"
                  className="font-mono tracking-wider"
                />
              </Field>
            </div>
            {actError && (
              <div className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
                {actError}
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" disabled={actBusy}>
                {actBusy ? 'Activating…' : 'Activate'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowActivate(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>

      <TeamCard />

      <Card className="mt-5">
        <CardHeader title="About" />
        <div className="flex items-center gap-3 px-5 py-4 text-sm text-muted">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-strong text-sm font-bold text-white">
            C
          </div>
          <div>
            <p className="font-semibold text-ink">ClientRegit 1.1.0</p>
            <p>
              Client management for video editors — data stays on this computer unless you join a
              team workspace.
            </p>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmRestore}
        title="Restore backup?"
        message="This permanently replaces ALL current data with the backup file you choose. You can cancel the file picker to abort."
        confirmLabel="Choose file & restore"
        danger
        onClose={() => setConfirmRestore(false)}
        onConfirm={() => {
          setConfirmRestore(false)
          void importBackup('replace')
        }}
      />
    </div>
  )
}

function TeamCard(): ReactNode {
  const { data: status, loading, reload } = useApi<TeamStatus>(() => api.team.status(), [])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status?.inTeam) {
      api.team
        .roster()
        .then(setMembers)
        .catch(() => setMembers([]))
    }
  }, [status?.inTeam])

  if (loading || !status?.inTeam) return null

  const syncNow = async (): Promise<void> => {
    setBusy(true)
    try {
      await api.team.syncNow()
      reload()
      toast.success('Sync complete')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-5">
      <CardHeader
        title="Team workspace"
        subtitle={status.teamName ?? 'Shared workspace'}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={status.lastError ? 'danger' : 'success'}>
              {status.lastError ? 'Sync error' : 'Syncing on'}
            </Badge>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void syncNow()}>
              {busy ? 'Syncing…' : 'Sync now'}
            </Button>
          </div>
        }
      />
      <div className="space-y-2.5 px-5 py-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Role</span>
          <span className="font-medium text-ink">
            {status.role === 'leader' ? 'Leader' : 'Member'} · {status.memberCount} member
            {status.memberCount === 1 ? '' : 's'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted">Last synced</span>
          <span className="font-medium text-ink">
            {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString('en-GB') : 'never'}
          </span>
        </div>
        {members.length > 0 && (
          <div className="border-t border-line pt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              Members
            </p>
            <ul className="space-y-1">
              {members.map((member) => (
                <li key={member.user_id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{member.email ?? member.user_id}</span>
                  {member.role === 'leader' && (
                    <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold-strong">
                      Leader
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="border-t border-line pt-3 text-xs text-muted">
          Clients, projects, tasks and invoices sync with your team automatically. Manage
          invites and seats on the website → Account → Team.
        </p>
        {status.lastError && (
          <div className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
            {status.lastError}
          </div>
        )}
      </div>
    </Card>
  )
}
