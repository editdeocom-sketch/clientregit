import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { closeDatabase, openDatabase } from './db/database'
import { registerApi } from './ipc/api'
import { initUpdater } from './updater'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#FCFCF7',
    title: 'ClientRegit',
    ...(app.isPackaged ? {} : { icon: join(app.getAppPath(), 'build/icon.png') }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.on('console-message', (details) => {
    const level = details.level as unknown
    const high = level === 'error' || level === 'warning' || (typeof level === 'number' && level >= 2)
    if (high) {
      console.error(`[renderer:${level}] ${details.message}`)
    }
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  const dbPath = join(app.getPath('userData'), 'clientregit.db')
  openDatabase(dbPath)
  registerApi()
  createWindow()
  initUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') app.quit()
})
