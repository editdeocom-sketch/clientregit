require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { getDb, initializeDatabase, queryOne, runSql, saveDb } = require('../database/database');

const WEAK_DEFAULTS = ['Admin@123', 'password', 'admin', 'changeme'];

function generateRandomPassword(length = 20) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

(async () => {
  const db = await getDb();
  initializeDatabase(db);

  const name = process.env.ADMIN_NAME || 'Admin';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('ADMIN_EMAIL must be a valid email address. Set it in server/.env before seeding.');
    process.exit(1);
  }

  let password = process.env.ADMIN_PASSWORD || '';

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    console.log(`Admin user already exists for ${email}. No changes made.`);
    process.exit(0);
  }

  if (password && (password.length < 12 || WEAK_DEFAULTS.includes(password))) {
    console.error('ADMIN_PASSWORD must be at least 12 characters and not a known default. Set a strong password in server/.env, or omit it to generate a random one.');
    process.exit(1);
  }

  const generated = !password;
  if (generated) {
    password = generateRandomPassword();
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  runSql('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, password_hash, 'admin']);
  saveDb();

  console.log(`Admin user created: ${email}`);
  if (generated) {
    console.log(`A temporary password was generated. It is shown ONCE below and cannot be recovered:`);
    console.log(`Password: ${password}`);
    console.log(`Log in and change it immediately from the Settings page.`);
  }
  process.exit(0);
})();
