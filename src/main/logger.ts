import { app } from 'electron'
import { appendFileSync, existsSync, mkdirSync, renameSync, statSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

let logsDirCache: string | null = null
const MAX_LOG_BYTES = 512 * 1024
const MAX_LOG_FILES = 5

export function logsDir(): string {
  if (!logsDirCache) {
    logsDirCache = join(app.getPath('userData'), 'logs')
    mkdirSync(logsDirCache, { recursive: true })
  }
  return logsDirCache
}

export function mainLogPath(): string {
  return join(logsDir(), 'main.log')
}

function rotate(): void {
  try {
    const file = mainLogPath()
    if (!existsSync(file) || statSync(file).size < MAX_LOG_BYTES) return
    const oldest = `${file}.${MAX_LOG_FILES}`
    if (existsSync(oldest)) unlinkSync(oldest)
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const from = `${file}.${i}`
      if (existsSync(from)) renameSync(from, `${file}.${i + 1}`)
    }
    renameSync(file, `${file}.1`)
  } catch {
    // logging must never break the app
  }
}

export function log(level: 'info' | 'warn' | 'error', message: string): void {
  try {
    rotate()
    appendFileSync(mainLogPath(), `[${new Date().toISOString()}] [${level}] ${message}\n`, 'utf8')
  } catch {
    // ignore
  }
}

export function installErrorLogging(): void {
  process.on('uncaughtException', (err) => {
    log('error', `uncaughtException: ${err.stack ?? err.message}`)
    console.error('[fatal] uncaughtException', err)
  })
  process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.stack ?? reason.message : String(reason)
    log('error', `unhandledRejection: ${msg}`)
    console.error('[fatal] unhandledRejection', reason)
  })
}
