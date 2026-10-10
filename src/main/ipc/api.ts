import { app, dialog, ipcMain, shell } from 'electron'
import { existsSync } from 'node:fs'
import * as clients from '../db/repos/clients'
import * as projects from '../db/repos/projects'
import * as invoices from '../db/repos/invoices'
import * as settingsRepo from '../db/repos/settings'
import * as stats from '../db/repos/stats'
import * as tasks from '../db/repos/tasks'
import * as backup from '../services/backup'
import { previewInvoice, printInvoice } from '../services/print'
import {
  activateLicense,
  deactivateLicense,
  getLicenseState,
  signInLicense
} from '../license/service'
import { authClient } from '../license/service'
import { getStatus, scheduleSync, syncNow } from '../sync/service'
import type {
  CalendarEvent,
  Currency,
  InvoicePrintFormat,
  LicenseActivateInput,
  LicenseSignInInput,
  SettingsPatch,
  TaskInput,
  TaskPatch
} from '../../shared/types'

type Handler = (...args: any[]) => any

function isoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

const domains: Record<string, Record<string, Handler>> = {
  clients: {
    list: clients.listClients,
    get: clients.getClient,
    create: clients.createClient,
    update: clients.updateClient,
    setArchived: clients.setClientArchived,
    remove: clients.deleteClient,
    totals: clients.clientTotals
  },
  projects: {
    list: projects.listProjects,
    get: projects.getProject,
    create: projects.createProject,
    update: projects.updateProject,
    remove: projects.deleteProject,
    files: projects.listProjectFiles,
    addFile: projects.addProjectFile,
    removeFile: projects.removeProjectFile
  },
  tasks: {
    list: (projectId: string) => tasks.listTasks(projectId),
    create: (projectId: string, input: TaskInput) => tasks.createTask(projectId, input),
    update: (id: string, patch: TaskPatch) => tasks.updateTask(id, patch),
    remove: (id: string) => tasks.deleteTask(id)
  },
  license: {
    getState: () => getLicenseState(),
    signIn: (input: LicenseSignInInput) => signInLicense(input),
    activate: (input: LicenseActivateInput) => activateLicense(input),
    deactivate: () => deactivateLicense()
  },
  team: {
    status: () => getStatus(),
    roster: async () => {
      const { data, error } = await authClient().rpc('team_roster')
      if (error) throw new Error(error.message)
      const payload = data as { ok?: boolean; members?: unknown[] } | null
      if (!payload?.ok) throw new Error('Join a team on the website to see members.')
      return payload.members ?? []
    },
    syncNow: () => syncNow()
  },
  invoices: {
    list: invoices.listInvoices,
    get: invoices.getInvoice,
    previewNumber: invoices.previewInvoiceNumber,
    create: invoices.createInvoice,
    update: invoices.updateInvoice,
    setStatus: invoices.setInvoiceStatus,
    remove: invoices.deleteInvoice,
    addPayment: invoices.addPayment,
    removePayment: invoices.removePayment,
    preview: (id: string) => previewInvoice(id),
    print: (id: string, format: InvoicePrintFormat) => printInvoice(id, format)
  },
  settings: {
    get: settingsRepo.getSettings,
    patch: (patch: SettingsPatch) => settingsRepo.patchSettings(patch)
  },
  dashboard: {
    stats: stats.getDashboardStats,
    revenue: (months: number, currency: Currency) => stats.getRevenue(months, currency),
    incomeByClient: (currency: Currency, limit: number) =>
      stats.getIncomeByClient(currency, limit),
    statusCounts: stats.getStatusCounts,
    upcoming: (days: number): CalendarEvent[] =>
      stats.getCalendarRange(isoDate(0), isoDate(days))
  },
  calendar: {
    range: (start: string, end: string) => stats.getCalendarRange(start, end)
  },
  backup: {
    exportJson: backup.exportJson,
    importJson: backup.importJson,
    exportCsv: backup.exportCsv,
    openDataFolder: async () => {
      await shell.openPath(app.getPath('userData'))
    }
  },
  files: {
    pick: async (properties: Array<'openFile' | 'openDirectory'>) => {
      const result = await dialog.showOpenDialog({ properties })
      return result.filePaths
    },
    openPath: async (path: string) => {
      const error = await shell.openPath(path)
      return { ok: error === '', error }
    },
    reveal: (path: string) => {
      if (!existsSync(path)) throw new Error('This path no longer exists')
      shell.showItemInFolder(path)
    },
    openExternal: (url: string) => {
      if (!/^https?:\/\//i.test(url)) throw new Error('Invalid link')
      void shell.openExternal(url)
    }
  }
}

const SYNC_MUTATIONS: Record<string, Set<string>> = {
  clients: new Set(['create', 'update', 'setArchived', 'remove']),
  projects: new Set(['create', 'update', 'remove']),
  tasks: new Set(['create', 'update', 'remove']),
  invoices: new Set(['create', 'update', 'setStatus', 'remove', 'addPayment', 'removePayment']),
  backup: new Set(['importJson'])
}

function afterMutation(domain: string, method: string, result: unknown): void {
  if (!SYNC_MUTATIONS[domain]?.has(method)) return
  if (result instanceof Promise) {
    result.then(() => scheduleSync()).catch(() => scheduleSync())
  } else {
    scheduleSync()
  }
}

export function registerApi(): void {
  ipcMain.handle('api', (_event, domain: string, method: string, ...args: unknown[]) => {
    const handler = domains[domain]?.[method]
    if (!handler) throw new Error(`Unknown API method: ${domain}.${method}`)
    try {
      const result = handler(...args)
      afterMutation(domain, method, result)
      return result
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err))
    }
  })
}
