import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function loadSimpleEnv(): Record<string, string> {
  const out: Record<string, string> = {}
  const path = resolve(__dirname, '.env')
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (match) out[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
  return out
}

const env = loadSimpleEnv()

const licenseDefine = {
  __SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL ?? ''),
  __SUPABASE_ANON_KEY__: JSON.stringify(env.VITE_SUPABASE_ANON_KEY ?? ''),
  __SITE_URL__: JSON.stringify(env.VITE_SITE_URL ?? '')
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: licenseDefine
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    define: licenseDefine
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [react(), tailwindcss()],
    define: licenseDefine
  }
})
