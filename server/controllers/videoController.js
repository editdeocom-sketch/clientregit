const { queryAll, queryOne, runSql, saveDb } = require('../database/database');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

exports.getVideos = (req, res) => {
  try {
    const { project, status } = req.query;
    let where = 'WHERE v.uploaded_by = ?';
    const params = [req.user.id];
    if (project) { where += ' AND v.project_id = ?'; params.push(project); }
    if (status) { where += ' AND v.status = ?'; params.push(status); }
    const videos = queryAll(`SELECT v.*, p.name as project_name FROM videos v LEFT JOIN projects p ON v.project_id = p.id ${where} ORDER BY v.created_at DESC`, params);
    res.json({ success: true, data: videos });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getVideoById = (req, res) => {
  try {
    const video = queryOne('SELECT v.*, p.name as project_name, u.name as uploaded_by_name FROM videos v LEFT JOIN projects p ON v.project_id = p.id LEFT JOIN users u ON v.uploaded_by = u.id WHERE v.id = ? AND v.uploaded_by = ?', [req.params.id, req.user.id]);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    res.json({ success: true, data: video });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createVideo = (req, res) => {
  try {
    const { project_id, title, file_path, file_url, file_name, file_size } = req.body;
    if (!title || !req.file) return res.status(400).json({ success: false, message: 'A video file and title are required' });
    if (project_id && !queryOne('SELECT id FROM projects WHERE id = ? AND created_by = ?', [project_id, req.user.id])) return res.status(404).json({ success: false, message: 'Project not found' });
    let version = 1;
    if (project_id) {
      const latest = queryOne('SELECT version FROM videos WHERE project_id = ? ORDER BY version DESC LIMIT 1', [project_id]);
      if (latest) version = latest.version + 1;
    }
    const storedPath = req.file.filename;
    const shareToken = crypto.randomBytes(24).toString('hex');
    const result = runSql('INSERT INTO videos (title, project_id, version, file_path, file_url, file_name, file_size, share_token, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, project_id || null, version, storedPath, `/uploads/videos/${encodeURIComponent(storedPath)}`, req.file.originalname, req.file.size, shareToken, req.user.id]);
    const video = queryOne('SELECT v.*, p.name as project_name FROM videos v LEFT JOIN projects p ON v.project_id = p.id WHERE v.id = ?', [result.lastInsertRowid]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'uploaded', 'video', video.id, `Uploaded video ${video.title} v${video.version}`]);
    saveDb();
    res.status(201).json({ success: true, data: video });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateVideoStatus = (req, res) => {
  try {
    const video = queryOne('SELECT * FROM videos WHERE id = ? AND uploaded_by = ?', [req.params.id, req.user.id]);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    if (!['awaiting_review', 'approved', 'revision_requested'].includes(req.body.status)) return res.status(400).json({ success: false, message: 'Invalid video status' });
    const result = runSql('UPDATE videos SET status = ?, updated_at = datetime(\'now\') WHERE id = ? AND uploaded_by = ?', [req.body.status, req.params.id, req.user.id]);
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Video not found' });
    const updated = queryOne('SELECT * FROM videos WHERE id = ?', [req.params.id]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'updated', 'video', video.id, `Updated video ${video.title} status to ${req.body.status}`]);
    saveDb();
    res.json({ success: true, data: updated });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.deleteVideo = (req, res) => {
  try {
    const video = queryOne('SELECT * FROM videos WHERE id = ? AND uploaded_by = ?', [req.params.id, req.user.id]);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    runSql('DELETE FROM video_comments WHERE video_id = ?', [req.params.id]);
    runSql('DELETE FROM videos WHERE id = ?', [req.params.id]);
    saveDb();
    if (video.file_path && req.app.locals.videoUploadDir) {
      const filePath = path.join(req.app.locals.videoUploadDir, path.basename(video.file_path));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.json({ success: true, data: {} });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getShareLink = (req, res) => {
  try {
    let video = queryOne('SELECT v.id, v.share_token FROM videos v WHERE v.id = ? AND v.uploaded_by = ?', [req.params.id, req.user.id]);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    if (!video.share_token) {
      video.share_token = crypto.randomBytes(24).toString('hex');
      runSql('UPDATE videos SET share_token = ?, updated_at = datetime(\'now\') WHERE id = ?', [video.share_token, video.id]);
      saveDb();
    }
    const origin = `${req.protocol}://${req.get('host')}`;
    res.json({ success: true, data: { token: video.share_token, url: `${origin}/shared/videos/${video.share_token}` } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getSharedVideo = (req, res) => {
  try {
    const video = queryOne('SELECT v.id, v.title, v.version, v.file_url, v.file_name, v.status, v.created_at, p.id as project_id, p.name as project_name, p.description as project_description, p.status as project_status, p.progress as project_progress, p.deadline as project_deadline FROM videos v LEFT JOIN projects p ON v.project_id = p.id WHERE v.share_token = ?', [req.params.token]);
    if (!video) return res.status(404).json({ success: false, message: 'Share link is invalid or expired' });
    res.json({ success: true, data: video });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getSharedComments = (req, res) => {
  try {
    const video = queryOne('SELECT id, uploaded_by FROM videos WHERE share_token = ?', [req.params.token]);
    if (!video) return res.status(404).json({ success: false, message: 'Share link is invalid or expired' });
    const comments = queryAll('SELECT vc.id, vc.timestamp, vc.comment, vc.created_at, COALESCE(NULLIF(vc.guest_name, \'\'), u.name, \'Client\') as user_name FROM video_comments vc LEFT JOIN users u ON vc.user_id = u.id WHERE vc.video_id = ? ORDER BY vc.timestamp ASC', [video.id]);
    res.json({ success: true, data: comments });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createSharedComment = (req, res) => {
  try {
    const video = queryOne('SELECT v.id, v.title, v.uploaded_by, p.name as project_name FROM videos v LEFT JOIN projects p ON v.project_id = p.id WHERE v.share_token = ?', [req.params.token]);
    const { timestamp, comment, guest_name, guest_email } = req.body;
    if (!video) return res.status(404).json({ success: false, message: 'Share link is invalid or expired' });
    if (!comment || !String(comment).trim()) return res.status(400).json({ success: false, message: 'Comment is required' });
    const result = runSql('INSERT INTO video_comments (video_id, timestamp, comment, guest_name, guest_email) VALUES (?, ?, ?, ?, ?)', [video.id, Number(timestamp) || 0, String(comment).trim(), String(guest_name || 'Client').trim(), String(guest_email || '').trim()]);
    const created = queryOne('SELECT id, timestamp, comment, created_at, guest_name as user_name FROM video_comments WHERE id = ?', [result.lastInsertRowid]);
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [video.uploaded_by, 'commented', 'video', video.id, `${String(guest_name || 'Client').trim()} commented on ${video.title}${video.project_name ? ` (${video.project_name})` : ''}`]);
    saveDb();
    res.status(201).json({ success: true, data: created });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.updateSharedStatus = (req, res) => {
  try {
    const video = queryOne('SELECT v.id, v.title, v.uploaded_by, p.name as project_name FROM videos v LEFT JOIN projects p ON v.project_id = p.id WHERE v.share_token = ?', [req.params.token]);
    const { status, guest_name, comment } = req.body;
    if (!video) return res.status(404).json({ success: false, message: 'Share link is invalid or expired' });
    if (!['approved', 'revision_requested'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid review status' });
    runSql('UPDATE videos SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', [status, video.id]);
    if (comment && String(comment).trim()) runSql('INSERT INTO video_comments (video_id, timestamp, comment, guest_name) VALUES (?, ?, ?, ?)', [video.id, 0, String(comment).trim(), String(guest_name || 'Client').trim()]);
    const action = status === 'approved' ? 'approved' : 'requested changes for';
    runSql('INSERT INTO activities (user_id, action, entity_type, entity_id, description) VALUES (?, ?, ?, ?, ?)', [video.uploaded_by, status, 'video', video.id, `${String(guest_name || 'Client')} ${action} video ${video.title}${video.project_name ? ` (${video.project_name})` : ''}`]);
    saveDb();
    res.json({ success: true, data: { id: video.id, status } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.getComments = (req, res) => {
  try {
    const comments = queryAll('SELECT vc.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar FROM video_comments vc LEFT JOIN users u ON vc.user_id = u.id WHERE vc.video_id = ? AND EXISTS (SELECT 1 FROM videos v WHERE v.id = vc.video_id AND v.uploaded_by = ?) ORDER BY vc.timestamp ASC', [req.params.id, req.user.id]);
    res.json({ success: true, data: comments });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

exports.createComment = (req, res) => {
  try {
    const { timestamp, comment } = req.body;
    const video = queryOne('SELECT id FROM videos WHERE id = ? AND uploaded_by = ?', [req.params.id, req.user.id]);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    if (!comment || !String(comment).trim()) return res.status(400).json({ success: false, message: 'Comment is required' });
    const result = runSql('INSERT INTO video_comments (video_id, user_id, timestamp, comment) VALUES (?, ?, ?, ?)', [req.params.id, req.user.id, timestamp || 0, comment]);
    saveDb();
    const newComment = queryOne('SELECT vc.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar FROM video_comments vc LEFT JOIN users u ON vc.user_id = u.id WHERE vc.id = ?', [result.lastInsertRowid]);
    res.status(201).json({ success: true, data: newComment });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
