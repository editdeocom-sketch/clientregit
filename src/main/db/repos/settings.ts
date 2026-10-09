import { getDb } from '../database'
import type { AppSettings, SettingsPatch } from '../../../shared/types'

const DEFAULTS: AppSettings = {
  business_name: '',
  business_tagline: '',
  business_email: '',
  business_phone: '',
  business_address: '',
  business_tax_id: '',
  currency: 'INR',
  tax_percent: 0,
  invoice_prefix: 'INV-',
  invoice_next: 1,
  invoice_terms: 'Thank you for your business!',
  theme: 'light'
}

function coerce(key: keyof AppSettings, raw: string): AppSettings[keyof AppSettings] {
  if (key === 'tax_percent' || key === 'invoice_next') return Number(raw) || 0
  if (key === 'currency') return raw === 'USD' ? 'USD' : 'INR'
  if (key === 'theme') return raw === 'dark' ? 'dark' : 'light'
  return raw
}

export function getSettings(): AppSettings {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as Array<{
    key: string
    value: string
  }>
  const result = { ...DEFAULTS }
  for (const row of rows) {
    if (row.key in DEFAULTS) {
      ;(result as Record<string, unknown>)[row.key] = coerce(
        row.key as keyof AppSettings,
        row.value
      )
    }
  }
  return result
}

export function patchSettings(patch: SettingsPatch): AppSettings {
  const db = getDb()
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
  const run = db.transaction(() => {
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || !(key in DEFAULTS)) continue
      upsert.run(key, String(value))
    }
  })
  run()
  return getSettings()
}

export function replaceSettings(settings: AppSettings): void {
  const db = getDb()
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
  const run = db.transaction(() => {
    for (const [key, value] of Object.entries({ ...DEFAULTS, ...settings })) {
      upsert.run(key, String(value))
    }
  })
  run()
}
