const { queryAll, queryOne, runSql, saveDb } = require('../database/database');

const recalculateTotals = (clientId, projectId) => {
  const clientTotal = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE client_id = ? AND status = 'completed'", [clientId]);
  runSql('UPDATE clients SET total_revenue = ?, updated_at = datetime(\'now\') WHERE id = ?', [clientTotal.total, clientId]);
  if (projectId) {
    const projectTotal = queryOne("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE project_id = ? AND status = 'completed'", [projectId]);
    const project = queryOne('SELECT budget FROM projects WHERE id = ?', [projectId]);
    runSql('UPDATE projects SET amount_paid = ?, remaining_amount = ?, updated_at = datetime(\'now\') WHERE id = ?', [projectTotal.total, Math.max(0, (project?.budget || 0) - projectTotal.total), projectId]);
  }
};

const validateReferences = (clientId, projectId, userId) => {
  const client = queryOne('SELECT id FROM clients WHERE id = ? AND created_by = ?', [clientId, userId]);
  if (!client) return 'Client not found';
  if (projectId) {
    const project = queryOne('SELECT id, client_id FROM projects WHERE id = ? AND created_by = ?', [projectId, userId]);
    if (!project) return 'Project not found';
    if (String(project.client_id) !== String(clientId)) return 'Project does not belong to this client';
  }
  return null;
};

exports.getPayments = (req, res) => {
  try {
    const payments = queryAll(`SELECT p.*, c.name as client_name, pr.name as project_name
      FROM payments p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN projects pr ON p.project_id = pr.id
      WHERE p.created_by = ? ORDER BY p.payment_date DESC, p.created_at DESC`, [req.user.id]);
    res.json({ success: true, data: payments });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getPaymentById = (req, res) => {
  try {
    const payment = queryOne(`SELECT p.*, c.name as client_name, pr.name as project_name
      FROM payments p LEFT JOIN clients c ON p.client_id = c.id LEFT JOIN projects pr ON p.project_id = pr.id
      WHERE p.id = ? AND p.created_by = ?`, [req.params.id, req.user.id]);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createPayment = (req, res) => {
  try {
    const { client_id, project_id, amount, payment_method, payment_date, status, transaction_id, notes } = req.body;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ success: false, message: 'Amount must be a finite number greater than zero' });
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status || 'completed')) return res.status(400).json({ success: false, message: 'Invalid payment status' });
    if (payment_method && !['bank_transfer', 'credit_card', 'paypal', 'cash', 'other'].includes(payment_method)) return res.status(400).json({ success: false, message: 'Invalid payment method' });
    const referenceError = validateReferences(client_id, project_id, req.user.id);
    if (referenceError) return res.status(404).json({ success: false, message: referenceError });
    runSql('BEGIN');
    const result = runSql('INSERT INTO payments (client_id, project_id, amount, payment_method, payment_date, status, transaction_id, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [client_id, project_id || null, numericAmount, payment_method || 'bank_transfer', payment_date || new Date().toISOString().split('T')[0], status || 'completed', transaction_id || '', notes || '', req.user.id]);
    recalculateTotals(client_id, project_id);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'created', 'payment', result.lastInsertRowid, `Added payment of ${numericAmount}`]);
    runSql('COMMIT');
    saveDb();
    res.status(201).json({ success: true, data: queryOne('SELECT * FROM payments WHERE id = ?', [result.lastInsertRowid]) });
  } catch (error) {
    try { runSql('ROLLBACK'); } catch (rollbackError) { /* preserve original error */ }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePayment = (req, res) => {
  try {
    const payment = queryOne('SELECT * FROM payments WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    const { client_id, project_id, amount, payment_method, payment_date, status, transaction_id, notes } = req.body;
    const nextClient = client_id ?? payment.client_id;
    const nextProject = project_id ?? payment.project_id;
    const numericAmount = amount === undefined ? payment.amount : Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return res.status(400).json({ success: false, message: 'Amount must be a finite number greater than zero' });
    if (status !== undefined && !['pending', 'completed', 'failed', 'refunded'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid payment status' });
    if (payment_method !== undefined && !['bank_transfer', 'credit_card', 'paypal', 'cash', 'other'].includes(payment_method)) return res.status(400).json({ success: false, message: 'Invalid payment method' });
    const referenceError = validateReferences(nextClient, nextProject, req.user.id);
    if (referenceError) return res.status(404).json({ success: false, message: referenceError });
    runSql('BEGIN');
    const result = runSql('UPDATE payments SET client_id=?, project_id=?, amount=?, payment_method=COALESCE(?,payment_method), payment_date=COALESCE(?,payment_date), status=COALESCE(?,status), transaction_id=COALESCE(?,transaction_id), notes=COALESCE(?,notes), updated_at=datetime(\'now\') WHERE id=? AND created_by=?', [nextClient, nextProject, numericAmount, payment_method, payment_date, status, transaction_id, notes, req.params.id, req.user.id]);
    if (result.changes === 0) { runSql('ROLLBACK'); return res.status(404).json({ success: false, message: 'Payment not found' }); }
    recalculateTotals(payment.client_id, payment.project_id);
    recalculateTotals(nextClient, nextProject);
    runSql('COMMIT');
    saveDb();
    res.json({ success: true, data: queryOne('SELECT * FROM payments WHERE id = ?', [req.params.id]) });
  } catch (error) {
    try { runSql('ROLLBACK'); } catch (rollbackError) { /* preserve original error */ }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePayment = (req, res) => {
  try {
    const payment = queryOne('SELECT * FROM payments WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    runSql('BEGIN');
    const result = runSql('DELETE FROM payments WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) { runSql('ROLLBACK'); return res.status(404).json({ success: false, message: 'Payment not found' }); }
    recalculateTotals(payment.client_id, payment.project_id);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'deleted', 'payment', payment.id, `Deleted payment of ${payment.amount}`]);
    runSql('COMMIT');
    saveDb();
    res.json({ success: true, data: {} });
  } catch (error) {
    try { runSql('ROLLBACK'); } catch (rollbackError) { /* preserve original error */ }
    res.status(500).json({ success: false, message: error.message });
  }
};
