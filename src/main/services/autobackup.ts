import { app, dialog } from 'electron'
import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getSettings, patchSettings } from '../db/repos/settings'
import { log } from '../logger'
import { buildBackupPayload } from './backup'

const KEEP_FILES = 7
const TICK_MS = 30 * 60 * 1000

function targetDir(): string {
  const configured = getSettings().auto_backup_dir
  return configured || join(app.getPath('userData'), 'auto-backups')
}

function intervalMs(): number {
  const interval = getSettings().auto_backup_interval
  if (interval === 'daily') return 24 * 60 * 60 * 1000
  if (interval === 'weekly') return 7 * 24 * 60 * 60 * 1000
  return 0
}

async function prune(dir: string): Promise<void> {
  try {
    const files = (await readdir(dir))
      .filter((name) => name.startsWith('clientregit-backup-') && name.endsWith('.json'))
      .sort()
    const excess = files.length - KEEP_FILES
    for (let i = 0; i < excess; i++) await unlink(join(dir, files[i]))
  } catch (err) {
    log('warn', `auto-backup prune failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export async function runAutoBackup(): Promise<string> {
  const dir = targetDir()
  await mkdir(dir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const file = join(dir, `clientregit-backup-${stamp}.json`)
  await writeFile(file, JSON.stringify(buildBackupPayload(), null, 2), 'utf8')
  await prune(dir)
  patchSettings({ auto_backup_last: new Date().toISOString() })
  log('info', `auto-backup written to ${file}`)
  return file
}

async function tick(): Promise<void> {
  try {
    const windowMs = intervalMs()
    if (!windowMs) return
    const last = getSettings().auto_backup_last
    if (last && Date.now() - Date.parse(last) < windowMs) return
    await runAutoBackup()
  } catch (err) {
    log(
      'error',
      `auto-backup failed: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`
    )
  }
}

export function startAutoBackupScheduler(): void {
  void tick()
  setInterval(() => void tick(), TICK_MS)
}

export async function chooseAutoBackupDir(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: 'Choose auto-backup folder',
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || !result.filePaths[0]) return null
  patchSettings({ auto_backup_dir: result.filePaths[0] })
  log('info', `auto-backup folder set to ${result.filePaths[0]}`)
  return result.filePaths[0]
}
