import { getDb, now } from './database'

export type TombstoneEntity = 'clients' | 'projects' | 'tasks' | 'invoices'

export function markTombstone(entity: TombstoneEntity, rowId: string): void {
  getDb()
    .prepare(
      'INSERT INTO tombstones (entity, row_id, deleted_at) VALUES (?, ?, ?) ' +
        'ON CONFLICT(entity, row_id) DO UPDATE SET deleted_at = excluded.deleted_at'
    )
    .run(entity, rowId, now())
}

export function markTombstones(entity: TombstoneEntity, rowIds: string[]): void {
  for (const id of rowIds) markTombstone(entity, id)
}

export interface TombstoneRow {
  entity: TombstoneEntity
  row_id: string
  deleted_at: string
}

export function listTombstones(): TombstoneRow[] {
  return getDb()
    .prepare('SELECT entity, row_id, deleted_at FROM tombstones')
    .all() as TombstoneRow[]
}

export function clearTombstonesBefore(cutoffIso: string): void {
  getDb().prepare('DELETE FROM tombstones WHERE deleted_at <= ?').run(cutoffIso)
}
