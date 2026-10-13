import { app, BrowserWindow, desktopCapturer, dialog, session, shell } from 'electron'
import { join, resolve } from 'node:path'
import { closeDatabase, openDatabase } from './db/database'
import { registerApi, sendToWindows } from './ipc/api'
import { startSyncLoop } from './sync/service'
import { markQuitting, onWindowClose, setupTray } from './tray'
import { initUpdater } from './updater'

const PROTOCOL = 'clientregit'
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

/** clientregit://join/<CODE> → renderer route */
let pendingNav: string | null = null

function flushPendingNav(win: BrowserWindow): void {
  if (pendingNav) {
    sendToWindows('nav:to', pendingNav)
    pendingNav = null
  }
}

function handleDeepLink(url: string): void {
  const match = /^clientregit:\/\/join\/([A-Za-z0-9]+)/.exec(url)
  if (!match) return
  const code = match[1].toUpperCase()
  const route = `/meetings/room/${code}`
  showMainWindow()
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents.isLoadingMainFrame()) {
    pendingNav = route
    mainWindow.webContents.once('did-finish-load', () => flushPendingNav(mainWindow!))
  } else {
    sendToWindows('nav:to', route)
  }
}

function deepLinkFromArgv(argv: string[]): string | null {
  return argv.find((a) => a.startsWith(`${PROTOCOL}://`)) ?? null
}

function setupPermissions(): void {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const allowed = new Set([
      'media',
      'mediaKeySystem',
      'notifications',
      'fullscreen',
      'pointerLock',
      'clipboard-read',
      'clipboard-write'
    ])
    callback(allowed.has(permission))
  })
}

function setupScreenPicker(): void {
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] })
        const screens = sources.filter((s) => s.id.startsWith('screen:'))
        const windows = sources.filter(
          (s) =>
            s.id.startsWith('window:') &&
            !s.name.includes('ClientRegit')
        )
        const options = [
          ...screens.map((s) => `Screen: ${s.name || 'Entire screen'}`),
          ...windows.slice(0, 8).map((s) => `Window: ${s.name}`),
          'Cancel'
        ]
        const choice = await dialog.showMessageBox({
          type: 'question',
          title: 'Share screen',
          message: 'Choose what to share',
          buttons: options,
          defaultId: 0,
          cancelId: options.length - 1,
          noLink: true
        })
        const picked =
          choice.response < screens.length
            ? screens[choice.response]
            : choice.response < screens.length + windows.slice(0, 8).length
              ? windows[choice.response - screens.length]
              : null
        if (!picked) {
          callback({})
          return
        }
        if (process.platform === 'win32') {
          callback({ video: picked, audio: 'loopback' })
        } else {
          callback({ video: picked })
        }
      } catch {
        callback({})
      }
    },
    { useSystemPicker: true }
  )
}

function setupProtocol(): void {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [resolve(process.argv[1])])
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL)
  }
}

// Dev/showcase affordances: override the data dir or open a CDP port when set.
if (process.env.CR_DATA_DIR) app.setPath('userData', process.env.CR_DATA_DIR)
if (process.env.CR_CDP_PORT) app.commandLine.appendSwitch('remote-debugging-port', process.env.CR_CDP_PORT)
if (process.env.CR_FAKE_MEDIA) {
  app.commandLine.appendSwitch('use-fake-device-for-media-stream')
  app.commandLine.appendSwitch('use-fake-ui-for-media-stream')
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const url = deepLinkFromArgv(argv)
    if (url) handleDeepLink(url)
    else showMainWindow()
  })

  app.on('open-url', (event, url) => {
    event.preventDefault()
    handleDeepLink(url)
  })

  app.whenReady().then(() => {
    const dbPath = join(app.getPath('userData'), 'clientregit.db')
    openDatabase(dbPath)
    registerApi()
    setupPermissions()
    setupScreenPicker()
    setupProtocol()
    createWindow()
    setupTray(() => showMainWindow())
    initUpdater()
    startSyncLoop()

    const coldLink = deepLinkFromArgv(process.argv)
    if (coldLink) handleDeepLink(coldLink)

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
