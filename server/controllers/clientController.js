const { queryAll, queryOne, runSql, saveDb } = require('../database/database');

exports.getClients = (req, res) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    let where = 'WHERE created_by = ?';
    const params = [req.user.id];
    if (search) { where += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM clients ${where}`, params);
    const total = totalRow ? totalRow.count : 0;
    const clients = queryAll(`SELECT * FROM clients ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    res.json({ success: true, data: clients, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getClientById = (req, res) => {
  try {
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createClient = (req, res) => {
  try {
    const { name, email, phone, company, address, city, state, country, website, notes, status, source } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Client name is required' });
    if (email && !/^\S+@\S+\.\S+$/.test(String(email).trim())) return res.status(400).json({ success: false, message: 'Invalid client email' });
    if (status !== undefined && !['active', 'inactive', 'archived'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid client status' });
    const result = runSql('INSERT INTO clients (name, email, phone, company, address, city, state, country, website, notes, status, source, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [String(name).trim(), email ? String(email).trim().toLowerCase() : '', phone || '', company || '', address || '', city || '', state || '', country || '', website || '', notes || '', status || 'active', source || '', req.user.id]);
    const client = queryOne('SELECT * FROM clients WHERE id = ?', [result.lastInsertRowid]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'created', 'client', client.id, `Created client ${client.name}`]);
    saveDb();
    res.status(201).json({ success: true, data: client });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateClient = (req, res) => {
  try {
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    const { name, email, phone, company, address, city, state, country, website, notes, status, source } = req.body;
    if (name !== undefined && !String(name).trim()) return res.status(400).json({ success: false, message: 'Client name cannot be empty' });
    if (email !== undefined && email && !/^\S+@\S+\.\S+$/.test(String(email).trim())) return res.status(400).json({ success: false, message: 'Invalid client email' });
    if (status !== undefined && !['active', 'inactive', 'archived'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid client status' });
    const result = runSql('UPDATE clients SET name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone), company=COALESCE(?,company), address=COALESCE(?,address), city=COALESCE(?,city), state=COALESCE(?,state), country=COALESCE(?,country), website=COALESCE(?,website), notes=COALESCE(?,notes), status=COALESCE(?,status), source=COALESCE(?,source), updated_at=datetime(\'now\') WHERE id=? AND created_by=?',
      [name !== undefined ? String(name).trim() : undefined, email ? String(email).trim().toLowerCase() : email, phone, company, address, city, state, country, website, notes, status, source, req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Client not found' });
    const updated = queryOne('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'updated', 'client', client.id, `Updated client ${client.name}`]);
    saveDb();
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteClient = (req, res) => {
  try {
    const client = queryOne('SELECT * FROM clients WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!client) return res.status(404).json({ success: false, message: 'Client not found' });
    const result = runSql('DELETE FROM clients WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Client not found' });
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'deleted', 'client', client.id, `Deleted client ${client.name}`]);
    saveDb();
    res.json({ success: true, data: {} });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
