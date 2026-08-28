const { queryAll, queryOne } = require('../database/database');

exports.getStats = (req, res) => {
  try {
    const userId = req.user.id;
    const totalClients = queryOne('SELECT COUNT(*) as count FROM clients WHERE created_by = ?', [userId]).count;
    const activeClients = queryOne("SELECT COUNT(*) as count FROM clients WHERE created_by = ? AND status = 'active'", [userId]).count;
    const totalProjects = queryOne('SELECT COUNT(*) as count FROM projects WHERE created_by = ?', [userId]).count;
    const activeProjects = queryOne("SELECT COUNT(*) as count FROM projects WHERE created_by = ? AND status IN ('lead','planning','editing','in_progress','review','revision')", [userId]).count;
    const completedProjects = queryOne("SELECT COUNT(*) as count FROM projects WHERE created_by = ? AND status IN ('completed','delivered')", [userId]).count;
    const pendingTasks = queryOne("SELECT COUNT(*) as count FROM tasks WHERE created_by = ? AND status IN ('todo','in_progress')", [userId]).count;
    const awaitingReviewVideos = queryOne("SELECT COUNT(*) as count FROM videos WHERE uploaded_by = ? AND status = 'awaiting_review'", [userId]).count;
    const invoiceData = queryOne("SELECT COALESCE(SUM(amount),0) as totalAmount, COALESCE(SUM(CASE WHEN status='paid' THEN amount ELSE 0 END),0) as paidAmount FROM invoices WHERE created_by = ? AND status IN ('sent','paid','overdue')", [userId]);
    const recentClients = queryAll('SELECT id, name, email, company, status FROM clients WHERE created_by = ? ORDER BY created_at DESC LIMIT 5', [userId]);
    const recentProjects = queryAll('SELECT p.id, p.name, p.status, p.progress, p.deadline, c.name as client_name FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.created_by = ? ORDER BY p.created_at DESC LIMIT 5', [userId]);
    const projectEarnings = queryAll(`SELECT p.id, p.name, c.name as client_name, p.budget, p.amount_paid, p.remaining_amount,
      COALESCE(SUM(CASE WHEN i.status IN ('sent', 'paid', 'overdue') THEN i.amount ELSE 0 END), 0) as invoiced_amount,
      COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) as invoiced_paid,
      CASE WHEN p.amount_paid > 0 THEN p.amount_paid ELSE COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount ELSE 0 END), 0) END as paid_amount
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN invoices i ON i.created_by = ? AND (i.project_id = p.id OR (i.project_id IS NULL AND i.client_id = p.client_id AND NOT EXISTS (SELECT 1 FROM invoices linked WHERE linked.project_id = p.id AND linked.created_by = ?)))
      WHERE p.created_by = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC`, [userId, userId, userId]);
    const recentActivity = queryAll('SELECT id, action, description, created_at, entity_type FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);

    res.json({
      success: true,
      data: {
        totalClients, activeClients, totalProjects, activeProjects, completedProjects,
        pendingTasks, awaitingReviewVideos,
        totalRevenue: invoiceData.totalAmount, totalPaid: invoiceData.paidAmount,
        outstandingBalance: invoiceData.totalAmount - invoiceData.paidAmount,
        projectEarnings, recentClients, recentProjects, recentActivity,
      },
    });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getRevisions = (req, res) => {
  try {
    const activities = queryAll(`SELECT a.id, a.action, a.description, a.created_at, v.id as video_id, v.title as video_title, v.status as video_status, v.version, p.id as project_id, p.name as project_name, p.status as project_status, p.progress as project_progress, p.deadline as project_deadline
      FROM activities a
      JOIN videos v ON a.entity_type = 'video' AND a.entity_id = v.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC LIMIT 50`, [req.user.id]);

    const reviewQueue = queryAll(`SELECT 'queue-' || v.id as id, 'awaiting_review' as action, 'Video awaiting your review' as description, v.created_at, v.id as video_id, v.title as video_title, v.status as video_status, v.version, p.id as project_id, p.name as project_name, p.status as project_status, p.progress as project_progress, p.deadline as project_deadline
      FROM videos v
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE v.uploaded_by = ? AND v.status IN ('awaiting_review', 'revision_requested')
      ORDER BY v.created_at DESC`, [req.user.id]);

    const comments = queryAll(`SELECT 'comment-' || vc.id as id, 'commented' as action, COALESCE(NULLIF(vc.guest_name, ''), u.name, 'Client') || ' commented: ' || vc.comment as description, vc.created_at, v.id as video_id, v.title as video_title, v.status as video_status, v.version, p.id as project_id, p.name as project_name, p.status as project_status, p.progress as project_progress, p.deadline as project_deadline
      FROM video_comments vc
      JOIN videos v ON vc.video_id = v.id
      LEFT JOIN users u ON vc.user_id = u.id
      LEFT JOIN projects p ON v.project_id = p.id
      WHERE v.uploaded_by = ?
      ORDER BY vc.created_at DESC`, [req.user.id]);

    const activityItems = activities.filter((item) => item.action !== 'commented');
    const seen = new Set([...activityItems, ...comments].map((item) => `${item.video_id}-${item.action}`));
    const combined = [...activityItems, ...comments, ...reviewQueue.filter((item) => !seen.has(`${item.video_id}-awaiting_review`))]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ success: true, data: combined });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
