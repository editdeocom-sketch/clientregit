const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'clientregit.db');

let db = null;

async function getDb() {
  if (db) return db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const stamp = `${process.pid}.${Date.now()}`;
  const tempPath = `${DB_PATH}.${stamp}.tmp`;
  const backupPath = `${DB_PATH}.previous`;
  const displacedPath = `${DB_PATH}.${stamp}.previous`;
  let handle;
  let displaced = false;
  try {
    handle = fs.openSync(tempPath, 'w');
    fs.writeSync(handle, buffer, 0, buffer.length, 0);
    fs.fsyncSync(handle);
    fs.closeSync(handle);
    handle = undefined;
    if (fs.statSync(tempPath).size === 0) throw new Error('Temporary database file is empty');

    if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, backupPath);
    if (fs.existsSync(DB_PATH)) {
      fs.renameSync(DB_PATH, displacedPath);
      displaced = true;
    }
    try {
      fs.renameSync(tempPath, DB_PATH);
    } catch (replaceError) {
      if (displaced && !fs.existsSync(DB_PATH)) fs.renameSync(displacedPath, DB_PATH);
      throw replaceError;
    }
    if (!fs.existsSync(DB_PATH) || fs.statSync(DB_PATH).size === 0) throw new Error('Database replacement verification failed');
    if (displaced && fs.existsSync(displacedPath)) fs.unlinkSync(displacedPath);
  } catch (error) {
    if (handle !== undefined) fs.closeSync(handle);
    try { fs.unlinkSync(tempPath); } catch (cleanupError) { /* preserve original error */ }
    console.error('DATABASE_PERSISTENCE_ERROR', { operation: 'saveDb', databasePath: DB_PATH, temporaryPath: tempPath, errorCode: error.code || 'UNKNOWN' });
    throw error;
  }
}

function initializeDatabase(database) {
    database.run(`
      CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'editor',
      avatar TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS settings (
      user_id INTEGER PRIMARY KEY,
      country TEXT NOT NULL DEFAULT 'India',
      currency TEXT NOT NULL DEFAULT 'INR',
      currency_symbol TEXT NOT NULL DEFAULT '₹',
      phone_code TEXT NOT NULL DEFAULT '+91',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      company TEXT DEFAULT '',
      address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      state TEXT DEFAULT '',
      country TEXT DEFAULT '',
      website TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      source TEXT DEFAULT '',
      total_revenue REAL DEFAULT 0,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      client_id INTEGER,
      service TEXT DEFAULT '',
      status TEXT DEFAULT 'lead',
      priority TEXT DEFAULT 'medium',
      start_date TEXT,
      deadline TEXT,
      budget REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      remaining_amount REAL DEFAULT 0,
      progress INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      project_id INTEGER,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      assignee_id INTEGER,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      project_id INTEGER,
      version INTEGER DEFAULT 1,
      file_path TEXT DEFAULT '',
      file_url TEXT DEFAULT '',
      file_name TEXT DEFAULT '',
      file_size INTEGER DEFAULT 0,
      status TEXT DEFAULT 'awaiting_review',
      uploaded_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS video_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER,
      user_id INTEGER,
      timestamp REAL DEFAULT 0,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
  // These migrations are additive so existing local databases keep their data.
  try { database.run('ALTER TABLE videos ADD COLUMN share_token TEXT'); } catch (error) { /* already exists */ }
  try { database.run('ALTER TABLE video_comments ADD COLUMN guest_name TEXT DEFAULT \'\''); } catch (error) { /* already exists */ }
  try { database.run('ALTER TABLE video_comments ADD COLUMN guest_email TEXT DEFAULT \'\''); } catch (error) { /* already exists */ }
  database.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_share_token ON videos(share_token)');
  database.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      client_id INTEGER,
      project_id INTEGER,
      description TEXT DEFAULT '',
      amount REAL NOT NULL,
      issue_date TEXT DEFAULT (date('now')),
      due_date TEXT,
      status TEXT DEFAULT 'draft',
      notes TEXT DEFAULT '',
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      project_id INTEGER,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'bank_transfer',
      payment_date TEXT DEFAULT (date('now')),
      status TEXT DEFAULT 'completed',
      transaction_id TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`);
  database.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT DEFAULT 'user',
      entity_id INTEGER,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

  database.run('CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by)');
  database.run('CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email)');
  database.run('CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by)');
  database.run('CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)');
  database.run('CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_videos_uploaded_by ON videos(uploaded_by)');
  database.run('CREATE INDEX IF NOT EXISTS idx_videos_project ON videos(project_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_video_comments_video ON video_comments(video_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by)');
  database.run('CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by)');
  database.run('CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at)');

  saveDb();
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  let result = null;
  if (stmt.step()) result = stmt.getAsObject();
  stmt.free();
  return result;
}

function runSql(sql, params = []) {
  const normalizedParams = params.map((value) => value === undefined ? null : value);
  db.run(sql, normalizedParams);
  const affectedRows = db.getRowsModified();
  const id = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
  return { lastInsertRowid: id, changes: affectedRows };
}

module.exports = { getDb, initializeDatabase, saveDb, queryAll, queryOne, runSql, DB_PATH };
