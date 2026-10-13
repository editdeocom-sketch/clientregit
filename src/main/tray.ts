import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getSettings } from './db/repos/settings'

let tray: Tray | null = null
let isQuitting = false

export function markQuitting(): void {
  isQuitting = true
}

export function trayIconPath(): string | null {
  const candidates = [
    join(app.getAppPath(), 'build', 'icon.png'),
    join(process.resourcesPath, 'icon.png'),
    join(app.getAppPath(), 'resources', 'icon.png')
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

export function setupTray(showWindow: () => void): void {
  if (tray) return
  const iconPath = trayIconPath()
  if (!iconPath) return
  const image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) return
  tray = new Tray(image)
  tray.setToolTip('ClientRegit')
  const menu = Menu.buildFromTemplate([
    { label: 'Open ClientRegit', click: () => showWindow() },
    { type: 'separator' },
    {
      label: 'Quit ClientRegit',
      click: () => {
        markQuitting()
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => showWindow())
}

export function shouldHideOnClose(): boolean {
  try {
    return getSettings().tray_on_close
  } catch {
    return false
  }
}

export function onWindowClose(event: Electron.Event, win: BrowserWindow): void {
  if (isQuitting) return
  if (!shouldHideOnClose()) return
  event.preventDefault()
  win.hide()
}
