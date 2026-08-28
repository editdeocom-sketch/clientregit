const { queryAll, queryOne, runSql, saveDb } = require('../database/database');

exports.getProjects = (req, res) => {
  try {
    const { search, status, client, priority, page = 1, limit = 100 } = req.query;
    let where = 'WHERE p.created_by = ?';
    const params = [req.user.id];
    if (search) { where += ' AND (p.name LIKE ? OR c.name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (client) { where += ' AND p.client_id = ?'; params.push(client); }
    if (priority) { where += ' AND p.priority = ?'; params.push(priority); }
    const totalRow = queryOne(`SELECT COUNT(*) as count FROM projects p LEFT JOIN clients c ON p.client_id = c.id ${where}`, params);
    const total = totalRow ? totalRow.count : 0;
    const projects = queryAll(`SELECT p.*, c.name as client_name, c.email as client_email FROM projects p LEFT JOIN clients c ON p.client_id = c.id ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);
    res.json({ success: true, data: projects, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getProjectById = (req, res) => {
  try {
    const project = queryOne('SELECT p.*, c.name as client_name, c.email as client_email, c.company as client_company, c.phone as client_phone FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ? AND p.created_by = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createProject = (req, res) => {
  try {
    const { name, description, client_id, service, status, priority, start_date, deadline, budget, amount_paid, notes } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ success: false, message: 'Project name is required' });
    const numericBudget = budget === undefined || budget === null || budget === '' ? 0 : Number(budget);
    const numericPaid = amount_paid === undefined || amount_paid === null || amount_paid === '' ? 0 : Number(amount_paid);
    if (!Number.isFinite(numericBudget) || numericBudget < 0 || !Number.isFinite(numericPaid) || numericPaid < 0) return res.status(400).json({ success: false, message: 'Budget and paid amount must be valid positive numbers' });
    if (status !== undefined && !['lead', 'planning', 'editing', 'in_progress', 'review', 'revision', 'approved', 'completed', 'delivered', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid project status' });
    if (priority !== undefined && !['low', 'medium', 'high', 'urgent'].includes(priority)) return res.status(400).json({ success: false, message: 'Invalid project priority' });
    if (numericPaid > numericBudget) return res.status(400).json({ success: false, message: 'Paid amount cannot exceed budget' });
    if (client_id !== undefined && client_id !== null && !queryOne('SELECT id FROM clients WHERE id = ? AND created_by = ?', [client_id, req.user.id])) return res.status(404).json({ success: false, message: 'Client not found' });
    const remaining_amount = numericBudget - numericPaid;
    const result = runSql('INSERT INTO projects (name, description, client_id, service, status, priority, start_date, deadline, budget, amount_paid, remaining_amount, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [String(name).trim(), description || '', client_id || null, service || '', status || 'lead', priority || 'medium', start_date || null, deadline || null, numericBudget, numericPaid, remaining_amount, notes || '', req.user.id]);
    const project = queryOne('SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ? AND p.created_by = ?', [result.lastInsertRowid, req.user.id]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'created', 'project', project.id, `Created project ${project.name}`]);
    saveDb();
    res.status(201).json({ success: true, data: project });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateProject = (req, res) => {
  try {
    const project = queryOne('SELECT * FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const { name, description, client_id, service, status, priority, start_date, deadline, budget, amount_paid, progress, notes } = req.body;
    if (progress !== undefined && (!Number.isFinite(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) {
      return res.status(400).json({ success: false, message: 'Progress must be a number between 0 and 100' });
    }
    if (status !== undefined && !['lead', 'planning', 'editing', 'in_progress', 'review', 'revision', 'approved', 'completed', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid project status' });
    }
    if (priority !== undefined && !['low', 'medium', 'high', 'urgent'].includes(priority)) return res.status(400).json({ success: false, message: 'Invalid project priority' });
    if (client_id !== undefined && client_id !== null && !queryOne('SELECT id FROM clients WHERE id = ? AND created_by = ?', [client_id, req.user.id])) return res.status(404).json({ success: false, message: 'Client not found' });
    if (budget !== undefined && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) return res.status(400).json({ success: false, message: 'Budget must be a valid non-negative number' });
    if (amount_paid !== undefined && (!Number.isFinite(Number(amount_paid)) || Number(amount_paid) < 0)) return res.status(400).json({ success: false, message: 'Paid amount must be a valid non-negative number' });
    const newBudget = budget !== undefined ? budget : project.budget;
    const newPaid = amount_paid !== undefined ? amount_paid : project.amount_paid;
    const numericProgress = progress === undefined ? undefined : Number(progress);
    if (numericProgress !== undefined && (!Number.isFinite(numericProgress) || numericProgress < 0 || numericProgress > 100)) return res.status(400).json({ success: false, message: 'Progress must be a number between 0 and 100' });
    if (newPaid > newBudget) return res.status(400).json({ success: false, message: 'Paid amount cannot exceed budget' });
    const remaining = newBudget - newPaid;
    const result = runSql('UPDATE projects SET name=COALESCE(?,name), description=COALESCE(?,description), client_id=COALESCE(?,client_id), service=COALESCE(?,service), status=COALESCE(?,status), priority=COALESCE(?,priority), start_date=COALESCE(?,start_date), deadline=COALESCE(?,deadline), budget=COALESCE(?,budget), amount_paid=COALESCE(?,amount_paid), remaining_amount=?, progress=COALESCE(?,progress), notes=COALESCE(?,notes), updated_at=datetime(\'now\') WHERE id=? AND created_by=?',
      [name, description, client_id, service, status, priority, start_date, deadline, budget === undefined ? undefined : Number(budget), amount_paid === undefined ? undefined : Number(amount_paid), remaining, numericProgress, notes, req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    const updated = queryOne('SELECT p.*, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = ? AND p.created_by = ?', [req.params.id, req.user.id]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'updated', 'project', project.id, `Updated project ${project.name}`]);
    saveDb();
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteProject = (req, res) => {
  try {
    const project = queryOne('SELECT * FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const result = runSql('DELETE FROM projects WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Project not found' });
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'deleted', 'project', project.id, `Deleted project ${project.name}`]);
    saveDb();
    res.json({ success: true, data: {} });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
