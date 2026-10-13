// CDP screenshot capture for the showcase dev instance.
// Usage: node scripts/capture-showcase.mjs <outDir> [port]
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outDir = process.argv[2]
const port = process.argv[3] || '9333'
if (!outDir) {
  console.error('Usage: node scripts/capture-showcase.mjs <outDir> [port]')
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })

const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
const page = targets.find((t) => t.type === 'page' && !t.url.startsWith('devtools://'))
if (!page) {
  console.error('No page target found. Is the app running with CR_CDP_PORT?')
  console.error(targets.map((t) => `${t.type} ${t.url}`).join('\n'))
  process.exit(1)
}

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

let nextId = 1
const pending = new Map()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(msg.error.message))
    else resolve(msg.result)
  }
}
function send(method, params = {}) {
  const id = nextId++
  ws.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function evalJs(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'evaluate failed')
  return result.result?.value
}

async function capture(name) {
  const shot = await send('Page.captureScreenshot', { format: 'png' })
  const path = join(outDir, `${name}.png`)
  writeFileSync(path, Buffer.from(shot.data, 'base64'))
  console.log(`saved ${path}`)
}

const shots = [
  ['dashboard', '#/', 2500],
  ['clients', '#/clients', 1800],
  ['project', '#/projects/p3', 1800],
  ['invoice', '#/invoices/i13', 1800],
  ['calendar', '#/calendar', 1800],
  ['reports', '#/reports', 2200]
]

await send('Page.enable')
await send('Runtime.enable')
await send('Page.bringToFront')

for (const [name, hash, wait] of shots) {
  await evalJs(`location.hash = ${JSON.stringify(hash)}`)
  await sleep(wait)
  await capture(name)
}

ws.close()
console.log('done')
