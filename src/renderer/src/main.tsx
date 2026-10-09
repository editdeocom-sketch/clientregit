import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { Toasts } from '@/components/ui/Toasts'
import { api } from '@/lib/api'
import { useUi } from '@/store/ui'
import './styles/index.css'

const root = document.getElementById('root')

async function boot(): Promise<void> {
  try {
    const settings = await api.settings.get()
    useUi.getState().setTheme(settings.theme)
    useUi.setState({ settingsLoaded: true })
  } catch (err) {
    console.error(err)
    useUi.setState({ settingsLoaded: true })
  }

  createRoot(root!).render(
    <StrictMode>
      <App />
      <Toasts />
    </StrictMode>
  )
}

void boot()
