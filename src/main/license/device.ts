import { createHash } from 'node:crypto'
import { hostname, platform, arch, userInfo } from 'node:os'
import { getLicenseRecord, saveLicense } from './store'

export function getDeviceId(): string {
  const existing = getLicenseRecord().device_id
  if (existing) return existing

  const material = [hostname(), platform(), arch(), userInfo().username].join('|')
  const id = `dev_${createHash('sha256').update(material).digest('hex').slice(0, 32)}`
  saveLicense({ device_id: id })
  return id
}
