const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('../database/database');

const backupsDir = path.join(__dirname, '..', '..', 'backups');
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

const date = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupsDir, `clientregit-${date}.db`);

if (!fs.existsSync(DB_PATH)) { console.error('Database not found.'); process.exit(1); }
fs.copyFileSync(DB_PATH, backupPath);
console.log(`Backup created: ${backupPath}`);
