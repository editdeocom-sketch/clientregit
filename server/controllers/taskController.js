const { queryAll, queryOne, runSql, saveDb } = require('../database/database');

exports.getTasks = (req, res) => {
  try {
    const { status, project, priority } = req.query;
    let where = 'WHERE t.created_by = ?';
    const params = [req.user.id];
    if (status) { where += ' AND t.status = ?'; params.push(status); }
    if (project) { where += ' AND t.project_id = ?'; params.push(project); }
    if (priority) { where += ' AND t.priority = ?'; params.push(priority); }
    const tasks = queryAll(`SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id ${where} ORDER BY t.created_at DESC`, params);
    res.json({ success: true, data: tasks });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createTask = (req, res) => {
  try {
    const { title, description, project_id, status, priority, due_date, assignee_id } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ success: false, message: 'Task title is required' });
    if (project_id && !queryOne('SELECT id FROM projects WHERE id = ? AND created_by = ?', [project_id, req.user.id])) return res.status(404).json({ success: false, message: 'Project not found' });
    if (status && !['todo', 'in_progress', 'review', 'done'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid task status' });
    if (priority && !['low', 'medium', 'high'].includes(priority)) return res.status(400).json({ success: false, message: 'Invalid task priority' });
    const result = runSql('INSERT INTO tasks (title, description, project_id, status, priority, due_date, assignee_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || '', project_id || null, status || 'todo', priority || 'medium', due_date || null, assignee_id || null, req.user.id]);
    const task = queryOne('SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?', [result.lastInsertRowid]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'created', 'task', task.id, `Created task ${task.title}`]);
    saveDb();
    res.status(201).json({ success: true, data: task });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateTask = (req, res) => {
  try {
    const task = queryOne('SELECT * FROM tasks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const { title, description, project_id, status, priority, due_date, assignee_id } = req.body;
    if (project_id !== undefined && project_id !== null && !queryOne('SELECT id FROM projects WHERE id = ? AND created_by = ?', [project_id, req.user.id])) return res.status(404).json({ success: false, message: 'Project not found' });
    if (status !== undefined && !['todo', 'in_progress', 'review', 'done'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid task status' });
    if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) return res.status(400).json({ success: false, message: 'Invalid task priority' });
    const result = runSql('UPDATE tasks SET title=COALESCE(?,title), description=COALESCE(?,description), project_id=COALESCE(?,project_id), status=COALESCE(?,status), priority=COALESCE(?,priority), due_date=COALESCE(?,due_date), assignee_id=COALESCE(?,assignee_id), updated_at=datetime(\'now\') WHERE id=? AND created_by=?',
      [title, description, project_id, status, priority, due_date, assignee_id, req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    saveDb();
    const updated = queryOne('SELECT t.*, p.name as project_name FROM tasks t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?', [req.params.id]);
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteTask = (req, res) => {
  try {
    const task = queryOne('SELECT * FROM tasks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const result = runSql('DELETE FROM tasks WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    saveDb();
    res.json({ success: true, data: {} });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
