import { contextBridge, ipcRenderer } from 'electron'
import type { Api } from '../shared/types'

function invoke<T>(domain: string, method: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke('api', domain, method, ...args) as Promise<T>
}

const api: Api = {
  clients: {
    list: (options) => invoke('clients', 'list', options),
    get: (id) => invoke('clients', 'get', id),
    create: (input) => invoke('clients', 'create', input),
    update: (id, input) => invoke('clients', 'update', id, input),
    setArchived: (id, archived) => invoke('clients', 'setArchived', id, archived),
    remove: (id) => invoke('clients', 'remove', id),
    totals: (id) => invoke('clients', 'totals', id)
  },
  projects: {
    list: (options) => invoke('projects', 'list', options),
    get: (id) => invoke('projects', 'get', id),
    create: (input) => invoke('projects', 'create', input),
    update: (id, input) => invoke('projects', 'update', id, input),
    remove: (id) => invoke('projects', 'remove', id),
    files: (projectId) => invoke('projects', 'files', projectId),
    addFile: (projectId, input) => invoke('projects', 'addFile', projectId, input),
    removeFile: (fileId) => invoke('projects', 'removeFile', fileId)
  },
  invoices: {
    list: (options) => invoke('invoices', 'list', options),
    get: (id) => invoke('invoices', 'get', id),
    previewNumber: () => invoke('invoices', 'previewNumber'),
    create: (input) => invoke('invoices', 'create', input),
    update: (id, input) => invoke('invoices', 'update', id, input),
    setStatus: (id, status) => invoke('invoices', 'setStatus', id, status),
    remove: (id) => invoke('invoices', 'remove', id),
    addPayment: (id, input) => invoke('invoices', 'addPayment', id, input),
    removePayment: (paymentId) => invoke('invoices', 'removePayment', paymentId),
    preview: (id) => invoke('invoices', 'preview', id),
    print: (id, format) => invoke('invoices', 'print', id, format)
  },
  tasks: {
    list: (projectId) => invoke('tasks', 'list', projectId),
    create: (projectId, input) => invoke('tasks', 'create', projectId, input),
    update: (id, patch) => invoke('tasks', 'update', id, patch),
    remove: (id) => invoke('tasks', 'remove', id)
  },
  license: {
    getState: () => invoke('license', 'getState'),
    signIn: (input) => invoke('license', 'signIn', input),
    activate: (input) => invoke('license', 'activate', input),
    deactivate: () => invoke('license', 'deactivate')
  },
  team: {
    status: () => invoke('team', 'status'),
    roster: () => invoke('team', 'roster'),
    syncNow: () => invoke('team', 'syncNow'),
    onSynced: (cb) => {
      const listener = (): void => cb()
      ipcRenderer.on('team:synced', listener)
      return () => ipcRenderer.removeListener('team:synced', listener)
    }
  },
  settings: {
    get: () => invoke('settings', 'get'),
    patch: (patch) => invoke('settings', 'patch', patch)
  },
  dashboard: {
    stats: () => invoke('dashboard', 'stats'),
    revenue: (months, currency) => invoke('dashboard', 'revenue', months, currency),
    incomeByClient: (currency, limit) => invoke('dashboard', 'incomeByClient', currency, limit),
    statusCounts: () => invoke('dashboard', 'statusCounts'),
    upcoming: (days) => invoke('dashboard', 'upcoming', days)
  },
  calendar: {
    range: (start, end) => invoke('calendar', 'range', start, end)
  },
  backup: {
    exportJson: () => invoke('backup', 'exportJson'),
    importJson: (mode) => invoke('backup', 'importJson', mode),
    exportCsv: (table) => invoke('backup', 'exportCsv', table),
    openDataFolder: () => invoke('backup', 'openDataFolder')
  },
  files: {
    pick: (properties) => invoke('files', 'pick', properties),
    openPath: (path) => invoke('files', 'openPath', path),
    reveal: (path) => invoke('files', 'reveal', path),
    openExternal: (url) => invoke('files', 'openExternal', url)
  }
}

contextBridge.exposeInMainWorld('api', api)
