export interface Migration {
  version: number
  sql: string
}

export const migrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT '#BF932A',
        currency TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'enquiry',
        priority TEXT NOT NULL DEFAULT 'normal',
        deadline TEXT,
        delivered_at TEXT,
        quoted_amount REAL,
        currency TEXT NOT NULL DEFAULT 'INR',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_projects_client ON projects(client_id);
      CREATE INDEX idx_projects_status ON projects(status);
      CREATE INDEX idx_projects_deadline ON projects(deadline);

      CREATE TABLE project_files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        label TEXT NOT NULL DEFAULT '',
        kind TEXT NOT NULL DEFAULT 'other',
        created_at TEXT NOT NULL
      );
      CREATE INDEX idx_project_files_project ON project_files(project_id);

      CREATE TABLE invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT NOT NULL UNIQUE,
        client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        currency TEXT NOT NULL DEFAULT 'INR',
        subtotal REAL NOT NULL DEFAULT 0,
        tax_percent REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        discount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_invoices_client ON invoices(client_id);
      CREATE INDEX idx_invoices_status ON invoices(status);
      CREATE INDEX idx_invoices_due ON invoices(due_date);

      CREATE TABLE invoice_items (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 1,
        rate REAL NOT NULL DEFAULT 0,
        amount REAL NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

      CREATE TABLE payments (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        paid_at TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT '',
        reference TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX idx_payments_invoice ON payments(invoice_id);
      CREATE INDEX idx_payments_date ON payments(paid_at);
    `
  },
  {
    version: 2,
    sql: `
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_tasks_project ON tasks(project_id);
    `
  },
  {
    version: 3,
    sql: `
      ALTER TABLE tasks ADD COLUMN assignee_id TEXT;

      CREATE TABLE tombstones (
        entity TEXT NOT NULL,
        row_id TEXT NOT NULL,
        deleted_at TEXT NOT NULL,
        PRIMARY KEY (entity, row_id)
      );
    `
  }
]
