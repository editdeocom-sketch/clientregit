import { getDb } from '../db/database'
import type { LicenseType } from '../../shared/types'

export interface LicenseRecord {
  trial_started_at: string | null
  activated: boolean
  email: string | null
  license_key: string | null
  license_type: LicenseType | null
  license_expires_at: string | null
  last_validated_at: string | null
}

const K = {
  trial: 'license.trial_started_at',
  activated: 'license.activated',
  email: 'license.email',
  key: 'license.key',
  type: 'license.type',
  expires: 'license.expires_at',
  validated: 'license.validated_at'
} as const

function readRows(): Map<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings WHERE key LIKE 'license.%'").all() as Array<{
    key: string
    value: string
  }>
  return new Map(rows.map((row) => [row.key, row.value]))
}

export function getLicenseRecord(): LicenseRecord {
  const rows = readRows()
  return {
    trial_started_at: rows.get(K.trial) ?? null,
    activated: rows.get(K.activated) === '1',
    email: rows.get(K.email) ?? null,
    license_key: rows.get(K.key) ?? null,
    license_type: rows.get(K.type) as LicenseType | null,
    license_expires_at: rows.get(K.expires) ?? null,
    last_validated_at: rows.get(K.validated) ?? null
  }
}

export function saveLicense(patch: Partial<LicenseRecord>): LicenseRecord {
  const db = getDb()
  const upsert = db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  )
  const map: Array<[string, string | null | boolean]> = []
  if (patch.trial_started_at !== undefined) map.push([K.trial, patch.trial_started_at])
  if (patch.activated !== undefined) map.push([K.activated, patch.activated ? '1' : '0'])
  if (patch.email !== undefined) map.push([K.email, patch.email])
  if (patch.license_key !== undefined) map.push([K.key, patch.license_key])
  if (patch.license_type !== undefined) map.push([K.type, patch.license_type])
  if (patch.license_expires_at !== undefined) map.push([K.expires, patch.license_expires_at])
  if (patch.last_validated_at !== undefined) map.push([K.validated, patch.last_validated_at])
  const run = db.transaction(() => {
    for (const [key, value] of map) {
      if (value === null) {
        db.prepare('DELETE FROM settings WHERE key = ?').run(key)
      } else {
        upsert.run(key, String(value))
      }
    }
  })
  run()
  return getLicenseRecord()
}

export function ensureTrialStarted(): LicenseRecord {
  const record = getLicenseRecord()
  if (!record.trial_started_at) {
    return saveLicense({ trial_started_at: new Date().toISOString() })
  }
  return record
}
