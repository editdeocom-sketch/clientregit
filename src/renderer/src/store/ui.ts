import { create } from 'zustand'

export interface ToastItem {
  id: number
  message: string
  tone: 'info' | 'success' | 'error'
}

interface UiState {
  theme: 'light' | 'dark'
  settingsLoaded: boolean
  toasts: ToastItem[]
  setTheme: (theme: 'light' | 'dark') => void
  addToast: (message: string, tone: ToastItem['tone']) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useUi = create<UiState>((set, get) => ({
  theme: 'light',
  settingsLoaded: false,
  toasts: [],
  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
  addToast: (message, tone) => {
    const id = ++toastId
    set({ toasts: [...get().toasts, { id, message, tone }] })
    setTimeout(() => get().removeToast(id), 4000)
  },
  removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) })
}))

export const toast = {
  info: (message: string) => useUi.getState().addToast(message, 'info'),
  success: (message: string) => useUi.getState().addToast(message, 'success'),
  error: (message: string) => useUi.getState().addToast(message, 'error')
}
