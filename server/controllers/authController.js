const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryAll, queryOne, runSql, saveDb } = require('../database/database');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;

function validatePassword(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (password.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters`;
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) return 'Password must contain at least one symbol';
  return null;
}

exports.register = (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    if (role && role !== 'editor') return res.status(400).json({ success: false, message: 'Self-registration only supports the editor role' });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ success: false, message: 'User already exists' });
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const result = runSql('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)', [name.trim(), email.trim().toLowerCase(), password_hash, 'editor', phone || '']);
    saveDb();
    const user = queryOne('SELECT id, name, email, role, avatar, phone FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken(user.id);
    res.status(201).json({ success: true, data: user, token });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = generateToken(user.id);
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword, token });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getMe = (req, res) => { res.json({ success: true, data: req.user }); };

exports.getPreferences = (req, res) => {
  try {
    let preferences = queryOne('SELECT country, currency, currency_symbol as currencySymbol, phone_code as phoneCode FROM settings WHERE user_id = ?', [req.user.id]);
    if (!preferences) {
      runSql("INSERT INTO settings (user_id, country, currency, currency_symbol, phone_code) VALUES (?, 'India', 'INR', '₹', '+91')", [req.user.id]);
      saveDb();
      preferences = queryOne('SELECT country, currency, currency_symbol as currencySymbol, phone_code as phoneCode FROM settings WHERE user_id = ?', [req.user.id]);
    }
    res.json({ success: true, data: preferences });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updatePreferences = (req, res) => {
  try {
    const { country, currency, currencySymbol, phoneCode } = req.body;
    if (!country || !currency || !currencySymbol || !phoneCode) return res.status(400).json({ success: false, message: 'Country and currency details are required' });
    runSql(`INSERT INTO settings (user_id, country, currency, currency_symbol, phone_code, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET country=excluded.country, currency=excluded.currency, currency_symbol=excluded.currency_symbol, phone_code=excluded.phone_code, updated_at=datetime('now')`, [req.user.id, country, currency, currencySymbol, phoneCode]);
    saveDb();
    const preferences = queryOne('SELECT country, currency, currency_symbol as currencySymbol, phone_code as phoneCode FROM settings WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, data: preferences });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateProfile = (req, res) => {
  try {
    const { name, phone, avatar, email } = req.body;
    if (email && email !== req.user.email) {
      const existing = queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    runSql('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar), email = COALESCE(?, email), updated_at = datetime(\'now\') WHERE id = ?', [name || null, phone || null, avatar || null, email || null, req.user.id]);
    saveDb();
    const user = queryOne('SELECT id, name, email, role, avatar, phone FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, data: user });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.changePassword = (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });
    const user = queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(newPassword, salt);
    runSql('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?', [password_hash, req.user.id]);
    saveDb();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteAccount = (req, res) => {
  try {
    const userId = req.user.id;
    runSql('BEGIN');
    // Remove owned records first because the legacy schema has mixed FK actions.
    runSql('DELETE FROM video_comments WHERE user_id = ?', [userId]);
    runSql('DELETE FROM video_comments WHERE video_id IN (SELECT id FROM videos WHERE uploaded_by = ?)', [userId]);
    runSql('DELETE FROM videos WHERE uploaded_by = ?', [userId]);
    runSql('UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ?', [userId]);
    runSql('DELETE FROM tasks WHERE created_by = ?', [userId]);
    runSql('DELETE FROM invoices WHERE created_by = ?', [userId]);
    runSql('DELETE FROM payments WHERE created_by = ?', [userId]);
    runSql('DELETE FROM projects WHERE created_by = ?', [userId]);
    runSql('DELETE FROM clients WHERE created_by = ?', [userId]);
    runSql('DELETE FROM activities WHERE user_id = ?', [userId]);
    runSql('DELETE FROM settings WHERE user_id = ?', [userId]);
    const result = runSql('DELETE FROM users WHERE id = ?', [userId]);
    if (result.changes === 0) {
      runSql('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Account not found' });
    }
    runSql('COMMIT');
    saveDb();
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    try { runSql('ROLLBACK'); } catch (rollbackError) { /* preserve original error */ }
    res.status(500).json({ success: false, message: 'Unable to delete account' });
  }
};
