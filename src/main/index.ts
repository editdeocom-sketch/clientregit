import { app, BrowserWindow, session, shell } from 'electron'
import { join } from 'node:path'
import { closeDatabase, openDatabase } from './db/database'
import { registerApi } from './ipc/api'
import { startSyncLoop } from './sync/service'
import { markQuitting, onWindowClose, setupTray } from './tray'
import { initUpdater } from './updater'

const APP_USER_MODEL_ID = 'com.clientregit.desktop'

if (process.platform === 'win32') app.setAppUserModelId(APP_USER_MODEL_ID)

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
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

  mainWindow = win
  win.on('ready-to-show', () => win.show())
  win.on('close', (event) => onWindowClose(event, win))
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })

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
  return win
}

function showMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  } else {
    createWindow()
  }
}

function setupPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = new Set([
      'notifications',
      'fullscreen',
      'pointerLock',
      'clipboard-read',
      'clipboard-write'
    ])
    callback(allowed.has(permission))
  })
}

// Dev affordances: override the data dir or open a CDP port when set.
if (process.env.CR_DATA_DIR) app.setPath('userData', process.env.CR_DATA_DIR)
if (process.env.CR_CDP_PORT) app.commandLine.appendSwitch('remote-debugging-port', process.env.CR_CDP_PORT)

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })

  app.whenReady().then(() => {
    const dbPath = join(app.getPath('userData'), 'clientregit.db')
    openDatabase(dbPath)
    registerApi()
    setupPermissions()
    createWindow()
    setupTray(() => showMainWindow())
    initUpdater()
    startSyncLoop()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('before-quit', () => {
    markQuitting()
  })

  app.on('window-all-closed', () => {
    closeDatabase()
    if (process.platform !== 'darwin') app.quit()
  })
}
