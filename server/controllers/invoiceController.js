const { queryAll, queryOne, runSql, saveDb } = require('../database/database');

exports.getInvoiceById = (req, res) => {
  try {
    const invoice = queryOne('SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.company as client_company, p.name as project_name, u.name as editor_name, u.email as editor_email FROM invoices i LEFT JOIN clients c ON i.client_id = c.id LEFT JOIN projects p ON i.project_id = p.id LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ? AND i.created_by = ?', [req.params.id, req.user.id]);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) { res.status(500).json({ success: false, message: 'Unable to load invoice' }); }
};

exports.getInvoices = (req, res) => {
  try {
    const { status, client } = req.query;
    let where = 'WHERE i.created_by = ?';
    const params = [req.user.id];
    if (status) { where += ' AND i.status = ?'; params.push(status); }
    if (client) { where += ' AND i.client_id = ?'; params.push(client); }
    const invoices = queryAll(`SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.company as client_company, c.address as client_address, c.city as client_city, c.state as client_state, c.country as client_country, c.website as client_website, p.name as project_name, u.name as editor_name, u.email as editor_email FROM invoices i LEFT JOIN clients c ON i.client_id = c.id LEFT JOIN projects p ON i.project_id = p.id LEFT JOIN users u ON i.created_by = u.id ${where} ORDER BY i.created_at DESC`, params);
    res.json({ success: true, data: invoices });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createInvoice = (req, res) => {
  try {
    const { client_id, project_id, description, amount, issue_date, due_date, status, notes } = req.body;
    const numericAmount = Number(amount);
    if (!client_id || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid client and positive invoice amount are required' });
    }
    const client = queryOne('SELECT id FROM clients WHERE id = ? AND created_by = ?', [client_id, req.user.id]);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    if (project_id && !queryOne('SELECT id FROM projects WHERE id = ? AND created_by = ?', [project_id, req.user.id])) return res.status(404).json({ success: false, message: 'Project not found' });
    const normalizedStatus = String(status || 'draft').toLowerCase();
    if (!['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(normalizedStatus)) return res.status(400).json({ success: false, message: 'Invalid invoice status' });
    const countRow = queryOne('SELECT COUNT(*) as count FROM invoices WHERE created_by = ?', [req.user.id]);
    let sequence = (countRow ? countRow.count : 0) + 1;
    let invoice_number = `INV-${String(sequence).padStart(4, '0')}`;
    while (queryOne('SELECT id FROM invoices WHERE invoice_number = ?', [invoice_number])) {
      sequence += 1;
      invoice_number = `INV-${String(sequence).padStart(4, '0')}`;
    }
    const result = runSql('INSERT INTO invoices (invoice_number, client_id, project_id, description, amount, issue_date, due_date, status, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [invoice_number, client_id, project_id || null, description || '', numericAmount, issue_date || new Date().toISOString().split('T')[0], due_date || null, normalizedStatus, notes || '', req.user.id]);
    const invoice = queryOne('SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.company as client_company, c.address as client_address, c.city as client_city, c.state as client_state, c.country as client_country, c.website as client_website, u.name as editor_name, u.email as editor_email FROM invoices i LEFT JOIN clients c ON i.client_id = c.id LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?', [result.lastInsertRowid]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'created', 'invoice', invoice.id, `Created invoice ${invoice.invoice_number}`]);
    saveDb();
    res.status(201).json({ success: true, data: invoice });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateInvoice = (req, res) => {
  try {
    const invoice = queryOne('SELECT * FROM invoices WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const { client_id, project_id, description, amount, issue_date, due_date, status, notes } = req.body;
    const normalizedStatus = status === undefined ? undefined : String(status).toLowerCase();
    if (normalizedStatus !== undefined && !['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice status' });
    }
    if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) return res.status(400).json({ success: false, message: 'Amount must be a finite number greater than zero' });
    if (client_id !== undefined && client_id !== null && !queryOne('SELECT id FROM clients WHERE id = ? AND created_by = ?', [client_id, req.user.id])) return res.status(404).json({ success: false, message: 'Client not found' });
    if (project_id !== undefined && project_id !== null && !queryOne('SELECT id FROM projects WHERE id = ? AND created_by = ?', [project_id, req.user.id])) return res.status(404).json({ success: false, message: 'Project not found' });
    const result = runSql('UPDATE invoices SET client_id=COALESCE(?,client_id), project_id=COALESCE(?,project_id), description=COALESCE(?,description), amount=COALESCE(?,amount), issue_date=COALESCE(?,issue_date), due_date=COALESCE(?,due_date), status=COALESCE(?,status), notes=COALESCE(?,notes), updated_at=datetime(\'now\') WHERE id=? AND created_by=?',
      [client_id, project_id, description, amount === undefined ? undefined : Number(amount), issue_date, due_date, normalizedStatus, notes, req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const updated = queryOne('SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.company as client_company, c.address as client_address, c.city as client_city, c.state as client_state, c.country as client_country, c.website as client_website, u.name as editor_name, u.email as editor_email FROM invoices i LEFT JOIN clients c ON i.client_id = c.id LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?', [req.params.id]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'updated', 'invoice', invoice.id, `Updated invoice ${invoice.invoice_number}`]);
    saveDb();
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteInvoice = (req, res) => {
  try {
    const invoice = queryOne('SELECT * FROM invoices WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const result = runSql('DELETE FROM invoices WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Invoice not found' });
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'deleted', 'invoice', invoice.id, `Deleted invoice ${invoice.invoice_number}`]);
    saveDb();
    res.json({ success: true, data: {} });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
