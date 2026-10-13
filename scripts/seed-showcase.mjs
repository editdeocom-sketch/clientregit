// One-off showcase DB seeder for landing-page screenshots.
// Usage: node scripts/seed-showcase.mjs <dataDir>
// Creates <dataDir>/clientregit.db with fictional demo data. Never touches the real user DB.
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const dataDir = process.argv[2]
if (!dataDir) {
  console.error('Usage: node scripts/seed-showcase.mjs <dataDir>')
  process.exit(1)
}

mkdirSync(dataDir, { recursive: true })
const dbPath = join(dataDir, 'clientregit.db')
rmSync(dbPath, { force: true })
rmSync(`${dbPath}-wal`, { force: true })
rmSync(`${dbPath}-shm`, { force: true })

const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE clients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#BF932A',
    currency TEXT, archived INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE TABLE projects (
    id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'enquiry',
    priority TEXT NOT NULL DEFAULT 'normal', deadline TEXT, delivered_at TEXT, quoted_amount REAL,
    currency TEXT NOT NULL DEFAULT 'INR', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_projects_client ON projects(client_id);
  CREATE INDEX idx_projects_status ON projects(status);
  CREATE INDEX idx_projects_deadline ON projects(deadline);
  CREATE TABLE project_files (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    path TEXT NOT NULL, label TEXT NOT NULL DEFAULT '', kind TEXT NOT NULL DEFAULT 'other', created_at TEXT NOT NULL
  );
  CREATE INDEX idx_project_files_project ON project_files(project_id);
  CREATE TABLE invoices (
    id TEXT PRIMARY KEY, invoice_number TEXT NOT NULL UNIQUE, client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL, issue_date TEXT NOT NULL, due_date TEXT,
    status TEXT NOT NULL DEFAULT 'draft', currency TEXT NOT NULL DEFAULT 'INR', subtotal REAL NOT NULL DEFAULT 0,
    tax_percent REAL NOT NULL DEFAULT 0, tax_amount REAL NOT NULL DEFAULT 0, discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_invoices_client ON invoices(client_id);
  CREATE INDEX idx_invoices_status ON invoices(status);
  CREATE INDEX idx_invoices_due ON invoices(due_date);
  CREATE TABLE invoice_items (
    id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 1, rate REAL NOT NULL DEFAULT 0,
    amount REAL NOT NULL DEFAULT 0, position INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
  CREATE TABLE payments (
    id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount REAL NOT NULL, paid_at TEXT NOT NULL, method TEXT NOT NULL DEFAULT '', reference TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX idx_payments_invoice ON payments(invoice_id);
  CREATE INDEX idx_payments_date ON payments(paid_at);
  CREATE TABLE tasks (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, due_date TEXT, position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_tasks_project ON tasks(project_id);
`)
db.exec('PRAGMA user_version = 2')

const now = '2026-10-09T10:00:00.000Z'
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

const settings = {
  business_name: 'Pixel & Frame Studio',
  business_tagline: 'Video editing & motion design',
  business_email: 'hello@pixelandframe.studio',
  business_phone: '+91 98765 43210',
  business_address: 'No. 12, 100 Feet Road, Indiranagar, Bengaluru 560038',
  business_tax_id: '29ABCDE1234F1Z5',
  currency: 'INR',
  tax_percent: '18',
  invoice_prefix: 'INV-',
  invoice_next: '17',
  invoice_terms: 'Thank you — it is a pleasure working with you!',
  theme: 'light'
}
const insSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
for (const [k, v] of Object.entries(settings)) insSetting.run(k, v)

const clients = [
  ['c1', 'Aarav Mehta', 'Frame & Co', 'aarav@frameandco.in', '+91 99001 11223', 'Koramangala, Bengaluru', 'Prefers punchy 9:16 cuts for socials. Pays fast.', 'retainer,video', '#BF932A'],
  ['c2', 'Neha Kapoor', 'Bloom Cosmetics', 'neha@bloomcosmetics.in', '+91 98110 22334', 'Lower Parel, Mumbai', 'Diwali campaign lead. Needs GST invoices.', 'campaign,gst', '#9E6200'],
  ['c3', 'Rohan Verma', 'Trekly', 'rohan@trekly.app', '+91 97400 33445', 'Hitec City, Hyderabad', 'SaaS explainer + app walkthroughs.', 'saas,retainer', '#6B7F3A'],
  ['c4', 'Ishita Rao', 'Studio Kraft', 'ishita@studiokraft.co', '+91 98800 44556', 'Jubilee Hills, Hyderabad', 'Agency partner — white-label edits.', 'agency,white-label', '#8A5A44'],
  ['c5', 'Zoya Khan', '', 'zoya.khan@gmail.com', '+91 99870 55667', 'Delhi', 'Personal brand content, monthly reels.', 'personal', '#7A6A9B'],
  ['c6', 'Sunil Rao', 'Rao Motors', 'sunil@raomotors.in', '+91 94480 66778', 'Peenya, Bengaluru', 'Showroom inventory videos every quarter.', 'automotive', '#4F6D7A'],
  ['c7', 'Tara Singh', 'Wanderleaf Café', 'tara@wanderleaf.cafe', '+91 96500 77889', 'Panjim, Goa', 'Menu launches and festive reels.', 'f&b', '#5F7A52'],
  ['c8', 'Vikram Nair', 'Nimbus', 'vikram@nimbus.dev', '+91 90350 88990', 'Kochi', 'Product demo videos for releases.', 'saas', '#6E7B8B']
]
const insClient = db.prepare(`INSERT INTO clients (id,name,company,email,phone,address,notes,tags,color,currency,archived,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'INR',0,?,?)`)
for (const c of clients) insClient.run(...c, '2025-11-01T09:00:00.000Z', now)

const projects = [
  ['p1', 'c1', 'Brand film — 60s launch edit', 'Hero brand film for the Series-A announcement. Square + vertical cutdowns included.', 'in_progress', 'high', '2026-10-18', null, 85000],
  ['p2', 'c1', 'YouTube episode 12', 'Long-form episode edit with thumbnails and chapters.', 'review', 'normal', '2026-10-12', null, 18000],
  ['p3', 'c2', 'Product teaser — Diwali campaign', '30s teaser + three 9:16 cutdowns. Client review round 2 in progress.', 'review', 'high', '2026-10-11', null, 120000],
  ['p4', 'c2', 'Instagram reels pack (x6)', 'Six short-form reels from the Diwali shoot footage.', 'revision', 'normal', '2026-10-15', null, 45000],
  ['p5', 'c3', 'App launch explainer', '90s animated explainer with UI screen recordings.', 'delivered', 'normal', '2026-09-18', '2026-09-20', 95000],
  ['p6', 'c4', 'Wedding highlight film', 'Three-day destination wedding. 6-minute highlight + teaser.', 'in_progress', 'normal', '2026-10-25', null, 60000],
  ['p7', 'c4', 'Podcast intro package', 'Animated intro, lower thirds and audio bed.', 'delivered', 'normal', '2026-08-26', '2026-08-28', 35000],
  ['p8', 'c5', 'Personal brand refresh', 'Monthly reels retainer — awaiting scope confirmation.', 'enquiry', 'low', null, null, 25000],
  ['p9', 'c6', 'Inventory showcase videos', 'Twelve 20s inventory clips for the festive sale.', 'in_progress', 'high', '2026-10-10', null, 40000],
  ['p10', 'c7', 'Menu launch motion graphics', 'Animated menu board videos for three outlets.', 'delivered', 'normal', '2026-09-04', '2026-09-05', 28000],
  ['p11', 'c8', 'SaaS demo walkthrough', 'Product walkthrough for the v2 release page.', 'review', 'normal', '2026-10-20', null, 55000],
  ['p12', 'c6', 'Festive TVC (30s)', 'Cancelled — budget reallocated to inventory clips.', 'cancelled', 'low', null, null, 150000]
]
const insProject = db.prepare(`INSERT INTO projects (id,client_id,title,description,status,priority,deadline,delivered_at,quoted_amount,currency,created_at,updated_at) VALUES (?,?,?,?,?,?,?,? ,?,'INR',?,?)`)
for (const p of projects) insProject.run(...p, '2026-08-01T09:00:00.000Z', now)

const files = [
  ['f1', 'p3', 'D:\\Projects\\Bloom\\Diwali_Teaser_v4.prproj', 'Diwali Teaser — v4', 'premiere'],
  ['f2', 'p3', 'D:\\Projects\\Bloom\\AE_Comps', 'After Effects comps', 'after_effects'],
  ['f3', 'p3', 'D:\\Projects\\Bloom\\Exports\\Review_Round_2', 'Review round 2 exports', 'folder'],
  ['f4', 'p1', 'D:\\Projects\\FrameAndCo\\BrandFilm_Master.prproj', 'Brand film — master', 'premiere'],
  ['f5', 'p6', 'D:\\Projects\\StudioKraft\\Wedding\\D1_Cam_A', 'Day 1 — Cam A rushes', 'folder'],
  ['f6', 'p11', 'D:\\Projects\\Nimbus\\Walkthrough_v2.drp', 'Walkthrough — Resolve grade', 'resolve']
]
const insFile = db.prepare('INSERT INTO project_files (id,project_id,path,label,kind,created_at) VALUES (?,?,?,?,?,?)')
for (const f of files) insFile.run(...f, now)

const tasks = [
  ['t1', 'p3', 'Rough cut with client logo sting', 1, null, 0],
  ['t2', 'p3', 'Colour grade pass', 1, null, 1],
  ['t3', 'p3', 'Share review link with Neha', 1, '2026-10-08', 2],
  ['t4', 'p3', 'Apply round-2 notes', 0, '2026-10-10', 3],
  ['t5', 'p3', 'Final export + captions', 0, '2026-10-11', 4],
  ['t6', 'p1', 'Assembly cut from selects', 1, null, 0],
  ['t7', 'p1', 'Sound design + music licence', 0, '2026-10-14', 1],
  ['t8', 'p1', 'Vertical cutdowns (3)', 0, '2026-10-16', 2],
  ['t9', 'p9', 'Shoot day 1 — 6 clips', 1, null, 0],
  ['t10', 'p9', 'Shoot day 2 — 6 clips', 0, '2026-10-09', 1]
]
const insTask = db.prepare('INSERT INTO tasks (id,project_id,title,done,due_date,position,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)')
for (const t of tasks) insTask.run(...t, now, now)

const invoices = []
let invNo = 1
function addInvoice(id, clientId, projectId, issueDate, dueDate, status, items, opts = {}) {
  const number = `INV-${String(invNo++).padStart(4, '0')}`
  const discount = opts.discount ?? 0
  const subtotal = round2(items.reduce((s, it) => s + it.q * it.r, 0))
  const taxable = round2(subtotal - discount)
  const tax = round2((taxable * 18) / 100)
  const total = round2(taxable + tax)
  invoices.push({ id, number, clientId, projectId, issueDate, dueDate, status, items, subtotal, tax, discount, total, payments: opts.payments ?? [], notes: opts.notes ?? '' })
}

addInvoice('i1', 'c1', null, '2025-11-10', '2025-11-24', 'paid', [
  { d: 'YouTube episode 8 — edit & grade', q: 1, r: 15000 }
], { payments: [{ a: 17700, at: '2025-11-18', m: 'Bank transfer', ref: 'UTR 8823194' }] })

addInvoice('i2', 'c4', null, '2026-01-05', '2026-01-19', 'paid', [
  { d: 'Corporate sizzle — edit', q: 1, r: 22000 },
  { d: 'Motion titles pack', q: 1, r: 8000 },
  { d: 'Extra revision round', q: 1, r: 2500 }
], { payments: [{ a: 41300, at: '2026-01-12', m: 'Bank transfer', ref: 'UTR 4410233' }] })

addInvoice('i3', 'c6', null, '2026-02-12', '2026-02-26', 'paid', [
  { d: 'Catalog video edits (4)', q: 4, r: 7000 }
], { payments: [{ a: 33040, at: '2026-02-20', m: 'UPI', ref: 'raomotors@upi' }] })

addInvoice('i4', 'c2', null, '2026-03-01', '2026-03-15', 'paid', [
  { d: 'Summer teaser — 45s edit', q: 1, r: 38000 },
  { d: '9:16 social cutdowns (2)', q: 2, r: 5000 }
], { payments: [{ a: 53100, at: '2026-03-08', m: 'Bank transfer', ref: 'UTR 7781022' }] })

addInvoice('i5', 'c6', null, '2026-04-08', '2026-04-22', 'paid', [
  { d: 'Showroom walkaround edits (4)', q: 4, r: 7000 }
], { payments: [{ a: 33040, at: '2026-04-18', m: 'UPI', ref: 'raomotors@upi' }] })

addInvoice('i6', 'c1', null, '2026-04-24', '2026-05-08', 'paid', [
  { d: 'YouTube episode 9 — edit', q: 1, r: 18000 }
], { payments: [{ a: 21240, at: '2026-05-02', m: 'Bank transfer', ref: 'UTR 9034411' }] })

addInvoice('i7', 'c7', null, '2026-06-05', '2026-06-19', 'paid', [
  { d: 'Monsoon reels (3)', q: 3, r: 6000 },
  { d: 'Photography retouch add-on', q: 1, r: 4000 }
], { payments: [{ a: 25960, at: '2026-06-15', m: 'UPI', ref: 'wanderleaf@upi' }] })

addInvoice('i8', 'c4', null, '2026-06-28', '2026-07-12', 'paid', [
  { d: 'Brand anthem — edit & grade', q: 1, r: 28000 },
  { d: 'Sound mix', q: 1, r: 5000 }
], { discount: 2000, payments: [{ a: 38920, at: '2026-07-08', m: 'Bank transfer', ref: 'UTR 1120987' }] })

addInvoice('i9', 'c3', null, '2026-08-04', '2026-08-18', 'paid', [
  { d: 'Feature launch video — 2m edit', q: 1, r: 40000 },
  { d: 'Subtitle pack (EN + HI)', q: 1, r: 8000 }
], { payments: [{ a: 56640, at: '2026-08-14', m: 'Bank transfer', ref: 'UTR 5567321' }] })

addInvoice('i10', 'c4', 'p7', '2026-08-24', '2026-09-07', 'paid', [
  { d: 'Podcast intro animation', q: 1, r: 25000 },
  { d: 'Lower thirds set', q: 1, r: 10000 }
], { payments: [{ a: 41300, at: '2026-09-01', m: 'Bank transfer', ref: 'UTR 6678432' }] })

addInvoice('i11', 'c7', 'p10', '2026-09-08', '2026-09-22', 'paid', [
  { d: 'Menu board animations (3 outlets)', q: 3, r: 8000 },
  { d: 'Festive end-card variants', q: 1, r: 4000 }
], { payments: [{ a: 33040, at: '2026-09-15', m: 'UPI', ref: 'wanderleaf@upi' }] })

addInvoice('i12', 'c6', null, '2026-09-05', '2026-09-20', 'overdue', [
  { d: 'Inventory clips — batch 1 (6)', q: 6, r: 5500 },
  { d: 'Stock music licences', q: 6, r: 833.333 }
], { notes: 'Reminder sent 30 Sep — festive sale deadline.' })

addInvoice('i13', 'c3', 'p5', '2026-09-22', '2026-10-06', 'paid', [
  { d: 'App explainer — 90s animation', q: 1, r: 80000 },
  { d: 'UI screen recording clean-up', q: 1, r: 15000 }
], { payments: [{ a: 112100, at: '2026-10-02', m: 'Bank transfer', ref: 'UTR 7781543' }] })

addInvoice('i14', 'c1', 'p2', '2026-10-03', '2026-10-17', 'sent', [
  { d: 'YouTube episode 12 — edit', q: 1, r: 15000 },
  { d: 'Thumbnail design (3)', q: 3, r: 1000 }
], { notes: 'Net 14. UPI or bank transfer.' })

addInvoice('i15', 'c4', 'p6', '2026-10-06', '2026-10-20', 'partial', [
  { d: 'Wedding highlight — 6 min film', q: 1, r: 48000 },
  { d: 'Teaser cut (60s)', q: 1, r: 12000 }
], { payments: [{ a: 30000, at: '2026-10-07', m: 'Bank transfer', ref: 'Advance — booking' }], notes: 'Advance received; balance on delivery.' })

addInvoice('i16', 'c2', 'p4', '2026-10-08', '2026-10-22', 'draft', [
  { d: 'Instagram reels (6)', q: 6, r: 7500 }
], { notes: 'Send after round-2 sign-off.' })

const insInv = db.prepare(`INSERT INTO invoices (id,invoice_number,client_id,project_id,issue_date,due_date,status,currency,subtotal,tax_percent,tax_amount,discount,total,notes,created_at,updated_at) VALUES (?,?,?,? ,?,? ,?,'INR',?,18,?,?,?, ?,?,?)`)
const insItem = db.prepare('INSERT INTO invoice_items (id,invoice_id,description,quantity,rate,amount,position) VALUES (?,?,?,?,?,?,?)')
const insPay = db.prepare('INSERT INTO payments (id,invoice_id,amount,paid_at,method,reference,notes) VALUES (?,?,?,?,?,?,?)')

for (const inv of invoices) {
  insInv.run(inv.id, inv.number, inv.clientId, inv.projectId, inv.issueDate, inv.dueDate, inv.status, inv.subtotal, inv.tax, inv.discount, inv.total, inv.notes, `${inv.issueDate}T10:00:00.000Z`, now)
  inv.items.forEach((it, i) => {
    insItem.run(`${inv.id}item${i}`, inv.id, it.d, it.q, it.r, round2(it.q * it.r), i)
  })
  inv.payments.forEach((p, i) => {
    insPay.run(`${inv.id}pay${i}`, inv.id, p.a, `${p.at}T12:00:00.000Z`, p.m, p.ref, '')
  })
}

db.close()
console.log(`Seeded ${dbPath}`)
console.log(`clients=${clients.length} projects=${projects.length} invoices=${invoices.length} files=${files.length} tasks=${tasks.length}`)
