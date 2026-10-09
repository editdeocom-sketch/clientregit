import Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { migrations } from './migrations'

let db: Database.Database | null = null

export function openDatabase(filePath: string): Database.Database {
  if (db) return db

  db = new Database(filePath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const current = db.pragma('user_version', { simple: true }) as number
  const applied = migrations.filter((m) => m.version > current)

  if (applied.length > 0) {
    const run = db.transaction(() => {
      for (const migration of applied) {
        db!.exec(migration.sql)
        db!.pragma(`user_version = ${migration.version}`)
      }
    })
    run()
  }

  return db
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function newId(): string {
  return randomUUID()
}

export function now(): string {
  return new Date().toISOString()
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
