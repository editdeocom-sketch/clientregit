function initAdminTables(database) {
  try {
    database.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        target_type TEXT DEFAULT '',
        target_id INTEGER,
        metadata TEXT DEFAULT '{}',
        ip_address TEXT DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);
  } catch (e) { /* already exists */ }

  try {
    database.run(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        site_title TEXT DEFAULT 'ClientRegit',
        site_description TEXT DEFAULT 'Professional client and project management',
        og_image TEXT DEFAULT '',
        favicon_url TEXT DEFAULT '',
        canonical_base_url TEXT DEFAULT '',
        google_verification_code TEXT DEFAULT '',
        google_analytics_id TEXT DEFAULT '',
        search_console_verification TEXT DEFAULT '',
        organization_name TEXT DEFAULT '',
        contact_email TEXT DEFAULT '',
        support_email TEXT DEFAULT '',
        social_links_json TEXT DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now'))
      )`);
  } catch (e) { /* already exists */ }

  try {
    database.run(`
      CREATE TABLE IF NOT EXISTS seo_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        homepage_title TEXT DEFAULT 'ClientRegit',
        homepage_description TEXT DEFAULT 'Professional client and project management',
        pricing_title TEXT DEFAULT 'Pricing',
        pricing_description TEXT DEFAULT 'Choose the plan that fits your needs',
        features_title TEXT DEFAULT 'Features',
        features_description TEXT DEFAULT 'Everything you need to manage clients',
        about_title TEXT DEFAULT 'About Us',
        about_description TEXT DEFAULT '',
        updated_at TEXT DEFAULT (datetime('now'))
      )`);
  } catch (e) { /* already exists */ }

  try {
    database.run(`
      CREATE TABLE IF NOT EXISTS ad_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        adsense_client_id TEXT DEFAULT '',
        adsense_enabled INTEGER DEFAULT 0,
        ad_positions_json TEXT DEFAULT '{}',
        updated_at TEXT DEFAULT (datetime('now'))
      )`);
  } catch (e) { /* already exists */ }

  try {
    database.run(`
      CREATE TABLE IF NOT EXISTS legal_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        status TEXT DEFAULT 'draft',
        version INTEGER DEFAULT 1,
        updated_by INTEGER,
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )`);
  } catch (e) { /* already exists */ }

  try {
    database.run(`
      CREATE TABLE IF NOT EXISTS legal_page_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_slug TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        version INTEGER NOT NULL,
        created_by INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )`);
  } catch (e) { /* already exists */ }

  try {
    database.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)');
    database.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    database.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');
    database.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id)');
    database.run('CREATE INDEX IF NOT EXISTS idx_legal_pages_slug ON legal_pages(page_slug)');
    database.run('CREATE INDEX IF NOT EXISTS idx_legal_page_versions_slug ON legal_page_versions(page_slug)');
  } catch (e) { /* already exists */ }
}

module.exports = { initAdminTables };
