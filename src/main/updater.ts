import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

export function initUpdater(): void {
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = console

  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // Offline or GitHub unreachable — keep working silently.
  })
}
