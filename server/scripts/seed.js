require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { getDb, initializeDatabase, queryOne, runSql, saveDb } = require('../database/database');

(async () => {
  const db = await getDb();
  initializeDatabase(db);

  const name = process.env.ADMIN_NAME || 'Admin';
  const email = process.env.ADMIN_EMAIL || 'admin@clientregit.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) { console.log('Admin user already exists.'); process.exit(0); }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);
  runSql('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, password_hash, 'admin']);
  saveDb();
  console.log(`Admin created: ${email}`);
  process.exit(0);
})();
