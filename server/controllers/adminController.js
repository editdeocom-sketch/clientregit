const { queryAll, queryOne, runSql, saveDb } = require('../database/database');
const { CURRENCIES, PLAN_DEFINITIONS, getPlan } = require('../config/billing');
const bcrypt = require('bcryptjs');

function logAudit(adminUserId, action, targetType, targetId, metadata, req) {
  try {
    runSql(
      'INSERT INTO audit_logs (user_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))',
      [
        adminUserId,
        action,
        targetType || '',
        targetId || null,
        JSON.stringify(metadata || {}),
        (req && req.ip) || '',
        (req && req.headers && req.headers['user-agent']) || ''
      ]
    );
  } catch (e) {
    console.error('AUDIT_LOG_ERROR', e);
  }
}

function paginate(query, params, page, limit) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (p - 1) * l;
  const stripped = query.replace(/ORDER BY .+$/i, '').trim();
  const countQuery = `SELECT COUNT(*) as total FROM (${stripped})`;
  const countResult = queryOne(countQuery, params);
  const total = countResult ? countResult.total : 0;
  const data = queryAll(query + ' LIMIT ? OFFSET ?', [...params, l, offset]);
  return { data, total, page: p, limit: l, totalPages: Math.ceil(total / l) };
}

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = queryOne('SELECT COUNT(*) as c FROM users').c;
    const newUsersToday = queryOne("SELECT COUNT(*) as c FROM users WHERE date(created_at) = date('now')").c;
    const newUsersThisWeek = queryOne("SELECT COUNT(*) as c FROM users WHERE created_at >= datetime('now', '-7 days')").c;
    const newUsersThisMonth = queryOne("SELECT COUNT(*) as c FROM users WHERE created_at >= datetime('now', 'start of month')").c;

    const freeUsers = queryOne("SELECT COUNT(*) as c FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM subscriptions WHERE status IN ('active','pending'))").c;
    const proUsers = queryOne("SELECT COUNT(DISTINCT s.user_id) as c FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.status = 'active' AND p.slug != 'lifetime'").c;
    const lifetimeUsers = queryOne("SELECT COUNT(DISTINCT s.user_id) as c FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.status = 'active' AND p.slug = 'lifetime'").c;

    const activeSubscriptions = queryOne("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'active'").c;
    const pendingSubscriptions = queryOne("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'pending'").c;
    const cancelledSubscriptions = queryOne("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'cancelled'").c;
    const expiredSubscriptions = queryOne("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'expired'").c;
    const failedSubscriptions = queryOne("SELECT COUNT(*) as c FROM subscriptions WHERE status = 'failed'").c;

    const totalRevenue = queryOne("SELECT COALESCE(SUM(amount), 0) as c FROM billing_payments WHERE status IN ('captured','completed')").c;
    const monthlyRevenue = queryOne("SELECT COALESCE(SUM(amount), 0) as c FROM billing_payments WHERE status IN ('captured','completed') AND created_at >= datetime('now', 'start of month')").c;
    const lifetimeRevenue = queryOne("SELECT COALESCE(SUM(amount), 0) as c FROM billing_payments WHERE status IN ('captured','completed') AND payment_type = 'lifetime'").c;

    const totalCoupons = queryOne('SELECT COUNT(*) as c FROM coupons').c;
    const usedCoupons = queryOne('SELECT COUNT(*) as c FROM coupons WHERE used_count > 0').c;

    const totalStorage = queryOne('SELECT COALESCE(SUM(file_size), 0) as c FROM videos').c;
    const totalProjects = queryOne('SELECT COUNT(*) as c FROM projects').c;
    const totalInvoices = queryOne('SELECT COUNT(*) as c FROM invoices').c;

    const failedPayments = queryOne("SELECT COUNT(*) as c FROM billing_payments WHERE status IN ('failed','refunded')").c;
    const webhookFailures = queryOne('SELECT COUNT(*) as c FROM webhook_events WHERE processed_at IS NULL').c;

    const recentActivity = queryAll('SELECT * FROM activities ORDER BY created_at DESC LIMIT 20');

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, newToday: newUsersToday, newThisWeek: newUsersThisWeek, newThisMonth: newUsersThisMonth, free: freeUsers, pro: proUsers, lifetime: lifetimeUsers },
        subscriptions: { active: activeSubscriptions, pending: pendingSubscriptions, cancelled: cancelledSubscriptions, expired: expiredSubscriptions, failed: failedSubscriptions },
        revenue: { total: totalRevenue, monthly: monthlyRevenue, lifetime: lifetimeRevenue },
        coupons: { total: totalCoupons, used: usedCoupons },
        storage: { totalBytes: totalStorage },
        projects: totalProjects,
        invoices: totalInvoices,
        payments: { failed: failedPayments },
        webhooks: { failures: webhookFailures },
        recentActivity
      }
    });
  } catch (error) {
    console.error('GET_DASHBOARD_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};

exports.getUsers = (req, res) => {
  try {
    const { page, limit, search, role, status } = req.query;
    let where = ['1=1'];
    let params = [];

    if (search) { where.push("(u.name LIKE ? OR u.email LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }
    if (role) { where.push("u.role = ?"); params.push(role); }

    const whereClause = where.join(' AND ');
    const result = paginate(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.created_at, u.updated_at,
              s.status as sub_status, s.currency as sub_currency, s.amount as sub_amount, s.expires_at as sub_expires,
              p.slug as plan_slug, p.name as plan_name,
              COALESCE(v.total_storage, 0) as total_storage,
              COALESCE(v.video_count, 0) as video_count
       FROM users u
       LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status IN ('active','pending')
       LEFT JOIN plans p ON s.plan_id = p.id
       LEFT JOIN (SELECT uploaded_by, SUM(file_size) as total_storage, COUNT(*) as video_count FROM videos GROUP BY uploaded_by) v ON v.uploaded_by = u.id
       WHERE ${whereClause}
       ORDER BY u.created_at DESC`,
      params,
      page,
      limit
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GET_USERS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load users' });
  }
};

exports.getUserDetails = (req, res) => {
  try {
    const userId = req.params.id;
    const user = queryOne('SELECT id, name, email, role, avatar, phone, created_at, updated_at FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const subscription = queryOne(
      `SELECT s.*, p.slug as plan_slug, p.name as plan_name, p.storage_bytes, p.prices_json
       FROM subscriptions s JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = ? ORDER BY s.created_at DESC LIMIT 1`,
      [userId]
    );

    const billingHistory = queryAll(
      `SELECT bp.*, p.name as plan_name
       FROM billing_payments bp JOIN plans p ON bp.plan_id = p.id
       WHERE bp.user_id = ? ORDER BY bp.created_at DESC LIMIT 50`,
      [userId]
    );

    const usage = queryOne('SELECT * FROM usage WHERE user_id = ?', [userId]);
    const recentActivity = queryAll('SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);

    const totalStorage = queryOne('SELECT COALESCE(SUM(file_size), 0) as total FROM videos WHERE uploaded_by = ?', [userId]).total;

    res.json({
      success: true,
      data: {
        ...user,
        subscription: subscription || null,
        billingHistory,
        usage: usage || { video_uploads_month: 0, video_storage_bytes: 0, invoice_count_month: 0 },
        totalStorage,
        recentActivity
      }
    });
  } catch (error) {
    console.error('GET_USER_DETAILS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load user details' });
  }
};

exports.updateUserRole = (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!role || !['admin', 'user', 'editor', 'client'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = queryOne('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").c;
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the last admin' });
      }
    }

    const oldRole = user.role;
    runSql('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?', [role, userId]);
    logAudit(req.user.id, 'USER_ROLE_CHANGED', 'user', userId, { oldRole, newRole: role }, req);

    const updated = queryOne('SELECT id, name, email, role, avatar, phone, created_at, updated_at FROM users WHERE id = ?', [userId]);
    saveDb();

    res.json({ success: true, data: updated, message: `User role changed to ${role}` });
  } catch (error) {
    console.error('UPDATE_USER_ROLE_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update user role' });
  }
};

exports.toggleUserStatus = (req, res) => {
  try {
    const userId = req.params.id;
    const { enabled } = req.body;

    const user = queryOne('SELECT id, role, is_disabled FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin' && enabled === false) {
      const adminCount = queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'admin' AND (is_disabled = 0 OR is_disabled IS NULL)").c;
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot disable the last admin' });
      }
    }

    runSql('UPDATE users SET is_disabled = ?, updated_at = datetime(\'now\') WHERE id = ?', [enabled === false ? 1 : 0, userId]);

    const action = enabled ? 'USER_ENABLED' : 'USER_DISABLED';
    logAudit(req.user.id, action, 'user', userId, { enabled: !!enabled }, req);

    saveDb();
    res.json({ success: true, message: enabled ? 'User enabled' : 'User disabled' });
  } catch (error) {
    console.error('TOGGLE_USER_STATUS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

exports.createUser = (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (!['admin', 'user', 'editor', 'client'].includes(role || 'user')) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const result = runSql(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), password_hash, role || 'user']
    );

    logAudit(req.user.id, 'USER_CREATED', 'user', result.lastInsertRowid, { name: name.trim(), email: email.trim().toLowerCase(), role: role || 'user' }, req);

    const user = queryOne('SELECT id, name, email, role, avatar, phone, created_at, updated_at FROM users WHERE id = ?', [result.lastInsertRowid]);
    saveDb();

    res.status(201).json({ success: true, data: user, message: 'User created' });
  } catch (error) {
    console.error('CREATE_USER_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

exports.deleteUser = (req, res) => {
  try {
    const userId = req.params.id;

    const user = queryOne('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      const adminCount = queryOne("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").c;
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last admin' });
      }
    }

    if (Number(userId) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    logAudit(req.user.id, 'USER_DELETED', 'user', userId, { role: user.role }, req);
    runSql('DELETE FROM users WHERE id = ?', [userId]);
    saveDb();

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('DELETE_USER_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

exports.getSubscriptions = (req, res) => {
  try {
    const { page, limit, plan, status, currency, user } = req.query;
    let where = ['1=1'];
    let params = [];

    if (plan) { where.push("p.slug = ?"); params.push(plan); }
    if (status) { where.push("s.status = ?"); params.push(status); }
    if (currency) { where.push("s.currency = ?"); params.push(currency); }
    if (user) { where.push("s.user_id = ?"); params.push(user); }

    const whereClause = where.join(' AND ');
    const result = paginate(
      `SELECT s.*, p.slug as plan_slug, p.name as plan_name, u.name as user_name, u.email as user_email
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       JOIN users u ON s.user_id = u.id
       WHERE ${whereClause}
       ORDER BY s.created_at DESC`,
      params,
      page,
      limit
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GET_SUBSCRIPTIONS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load subscriptions' });
  }
};

exports.getPayments = (req, res) => {
  try {
    const { page, limit, status, currency, plan, user, dateFrom, dateTo } = req.query;
    let where = ['1=1'];
    let params = [];

    if (status) { where.push("bp.status = ?"); params.push(status); }
    if (currency) { where.push("bp.currency = ?"); params.push(currency); }
    if (plan) { where.push("p.slug = ?"); params.push(plan); }
    if (user) { where.push("bp.user_id = ?"); params.push(user); }
    if (dateFrom) { where.push("bp.created_at >= ?"); params.push(dateFrom); }
    if (dateTo) { where.push("bp.created_at <= ?"); params.push(dateTo + ' 23:59:59'); }

    const whereClause = where.join(' AND ');
    const result = paginate(
      `SELECT bp.*, p.slug as plan_slug, p.name as plan_name, u.name as user_name, u.email as user_email
       FROM billing_payments bp
       JOIN plans p ON bp.plan_id = p.id
       JOIN users u ON bp.user_id = u.id
       WHERE ${whereClause}
       ORDER BY bp.created_at DESC`,
      params,
      page,
      limit
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GET_PAYMENTS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load payments' });
  }
};

exports.getPlans = (req, res) => {
  try {
    const plans = queryAll('SELECT * FROM plans ORDER BY id ASC');
    const enriched = plans.map(p => {
      const config = getPlan(p.slug);
      return { ...p, prices: JSON.parse(p.prices_json || '{}'), config };
    });
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('GET_PLANS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load plans' });
  }
};

exports.updatePlan = (req, res) => {
  try {
    const planId = req.params.id;
    const plan = queryOne('SELECT * FROM plans WHERE id = ?', [planId]);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const { name, active, storage_bytes, prices_json } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
    if (storage_bytes !== undefined) { updates.push('storage_bytes = ?'); params.push(storage_bytes); }
    if (prices_json !== undefined) { updates.push('prices_json = ?'); params.push(JSON.stringify(prices_json)); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(planId);

    runSql(`UPDATE plans SET ${updates.join(', ')} WHERE id = ?`, params);
    logAudit(req.user.id, 'PRICE_UPDATED', 'plan', planId, { changes: req.body }, req);

    const updated = queryOne('SELECT * FROM plans WHERE id = ?', [planId]);
    updated.prices = JSON.parse(updated.prices_json || '{}');
    saveDb();

    res.json({ success: true, data: updated, message: 'Plan updated' });
  } catch (error) {
    console.error('UPDATE_PLAN_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update plan' });
  }
};

exports.getCoupons = (req, res) => {
  try {
    const { page, limit, active, discount_type, currency } = req.query;
    let where = ['1=1'];
    let params = [];

    if (active !== undefined) { where.push("active = ?"); params.push(active === 'true' || active === '1' ? 1 : 0); }
    if (discount_type) { where.push("discount_type = ?"); params.push(discount_type); }
    if (currency) { where.push("currency = ? OR currency IS NULL"); params.push(currency); }

    const whereClause = where.join(' AND ');
    const result = paginate(
      `SELECT c.*, (SELECT COUNT(*) FROM coupon_redemptions cr WHERE cr.coupon_id = c.id) as redemption_count
       FROM coupons c
       WHERE ${whereClause}
       ORDER BY c.created_at DESC`,
      params,
      page,
      limit
    );

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GET_COUPONS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load coupons' });
  }
};

exports.createCoupon = (req, res) => {
  try {
    const { code, description, discount_type, discount_value, currency, plan_slugs, max_uses, valid_from, valid_until } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ success: false, message: 'Code, discount_type, and discount_value are required' });
    }

    if (!['percent', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ success: false, message: 'discount_type must be percent or fixed' });
    }

    const existing = queryOne('SELECT id FROM coupons WHERE code = ?', [code.toUpperCase()]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const result = runSql(
      'INSERT INTO coupons (code, description, discount_type, discount_value, currency, plan_slugs, max_uses, valid_from, valid_until, active, used_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, datetime(\'now\'))',
      [
        code.toUpperCase(),
        description || '',
        discount_type,
        discount_value,
        currency || null,
        plan_slugs || null,
        max_uses || null,
        valid_from || new Date().toISOString().split('T')[0],
        valid_until || null
      ]
    );

    const created = queryOne('SELECT * FROM coupons WHERE id = ?', [result.lastInsertRowid]);
    logAudit(req.user.id, 'COUPON_CREATED', 'coupon', result.lastInsertRowid, { code: code.toUpperCase(), discount_type, discount_value }, req);
    saveDb();

    res.status(201).json({ success: true, data: created, message: 'Coupon created' });
  } catch (error) {
    console.error('CREATE_COUPON_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to create coupon' });
  }
};

exports.updateCoupon = (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = queryOne('SELECT * FROM coupons WHERE id = ?', [couponId]);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    const { code, description, discount_type, discount_value, currency, plan_slugs, max_uses, valid_from, valid_until } = req.body;
    const updates = [];
    const params = [];

    if (code !== undefined) { updates.push('code = ?'); params.push(code.toUpperCase()); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (discount_type !== undefined) { updates.push('discount_type = ?'); params.push(discount_type); }
    if (discount_value !== undefined) { updates.push('discount_value = ?'); params.push(discount_value); }
    if (currency !== undefined) { updates.push('currency = ?'); params.push(currency); }
    if (plan_slugs !== undefined) { updates.push('plan_slugs = ?'); params.push(plan_slugs); }
    if (max_uses !== undefined) { updates.push('max_uses = ?'); params.push(max_uses); }
    if (valid_from !== undefined) { updates.push('valid_from = ?'); params.push(valid_from); }
    if (valid_until !== undefined) { updates.push('valid_until = ?'); params.push(valid_until); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    params.push(couponId);
    runSql(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`, params);
    logAudit(req.user.id, 'COUPON_UPDATED', 'coupon', couponId, { changes: req.body }, req);

    const updated = queryOne('SELECT * FROM coupons WHERE id = ?', [couponId]);
    saveDb();

    res.json({ success: true, data: updated, message: 'Coupon updated' });
  } catch (error) {
    console.error('UPDATE_COUPON_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon' });
  }
};

exports.toggleCoupon = (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = queryOne('SELECT * FROM coupons WHERE id = ?', [couponId]);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    const newActive = coupon.active ? 0 : 1;
    runSql('UPDATE coupons SET active = ? WHERE id = ?', [newActive, couponId]);

    const action = newActive ? 'COUPON_ENABLED' : 'COUPON_DISABLED';
    logAudit(req.user.id, action, 'coupon', couponId, { code: coupon.code }, req);

    const updated = queryOne('SELECT * FROM coupons WHERE id = ?', [couponId]);
    saveDb();

    res.json({ success: true, data: updated, message: newActive ? 'Coupon enabled' : 'Coupon disabled' });
  } catch (error) {
    console.error('TOGGLE_COUPON_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to toggle coupon' });
  }
};

exports.deleteCoupon = (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = queryOne('SELECT * FROM coupons WHERE id = ?', [couponId]);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    runSql('UPDATE coupons SET active = 0 WHERE id = ?', [couponId]);
    logAudit(req.user.id, 'COUPON_DELETED', 'coupon', couponId, { code: coupon.code }, req);
    saveDb();

    res.json({ success: true, message: 'Coupon archived' });
  } catch (error) {
    console.error('DELETE_COUPON_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to delete coupon' });
  }
};

exports.getStorage = (req, res) => {
  try {
    const totalStorage = queryOne('SELECT COALESCE(SUM(file_size), 0) as total FROM videos').total;

    const byPlan = queryAll(
      `SELECT p.slug, p.name, p.storage_bytes,
              COALESCE(SUM(v.file_size), 0) as used_storage,
              COUNT(DISTINCT v.uploaded_by) as user_count
       FROM plans p
       LEFT JOIN subscriptions s ON s.plan_id = p.id AND s.status = 'active'
       LEFT JOIN videos v ON v.uploaded_by = s.user_id
       GROUP BY p.id`
    );

    const largestUsers = queryAll(
      `SELECT u.id, u.name, u.email, COALESCE(SUM(v.file_size), 0) as total_storage, COUNT(v.id) as video_count
       FROM users u
       JOIN videos v ON v.uploaded_by = u.id
       GROUP BY u.id
       ORDER BY total_storage DESC
       LIMIT 10`
    );

    const largestVideos = queryAll(
      `SELECT v.id, v.title, v.file_size, v.file_name, u.name as uploader_name
       FROM videos v
       JOIN users u ON v.uploaded_by = u.id
       ORDER BY v.file_size DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        totalStorage,
        byPlan,
        largestUsers,
        largestVideos
      }
    });
  } catch (error) {
    console.error('GET_STORAGE_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load storage stats' });
  }
};

exports.getAuditLogs = (req, res) => {
  try {
    const { page, limit, admin, action, target_type, dateFrom, dateTo } = req.query;
    let where = ['1=1'];
    let params = [];

    if (admin) { where.push("al.user_id = ?"); params.push(admin); }
    if (action) { where.push("al.action = ?"); params.push(action); }
    if (target_type) { where.push("al.target_type = ?"); params.push(target_type); }
    if (dateFrom) { where.push("al.created_at >= ?"); params.push(dateFrom); }
    if (dateTo) { where.push("al.created_at <= ?"); params.push(dateTo + ' 23:59:59'); }

    const whereClause = where.join(' AND ');
    const result = paginate(
      `SELECT al.id, al.user_id, al.action, al.target_type, al.target_id, al.metadata, al.ip_address, al.created_at,
              u.name as admin_name, u.email as admin_email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE ${whereClause}
       ORDER BY al.created_at DESC`,
      params,
      page,
      limit
    );

    const safeLogs = result.data.map(log => {
      const parsed = typeof log.metadata === 'string' ? JSON.parse(log.metadata || '{}') : log.metadata || {};
      delete parsed.password;
      delete parsed.token;
      delete parsed.password_hash;
      return { ...log, metadata: parsed };
    });

    res.json({ success: true, ...result, data: safeLogs });
  } catch (error) {
    console.error('GET_AUDIT_LOGS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load audit logs' });
  }
};

exports.getSettings = (req, res) => {
  try {
    let settings = queryOne('SELECT * FROM site_settings WHERE id = 1');
    if (!settings) {
      runSql("INSERT INTO site_settings (id) VALUES (1)");
      settings = queryOne('SELECT * FROM site_settings WHERE id = 1');
    }
    settings.social_links = JSON.parse(settings.social_links_json || '{}');
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GET_SETTINGS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
};

exports.updateSettings = (req, res) => {
  try {
    let settings = queryOne('SELECT * FROM site_settings WHERE id = 1');
    if (!settings) {
      runSql("INSERT INTO site_settings (id) VALUES (1)");
      settings = queryOne('SELECT * FROM site_settings WHERE id = 1');
    }

    const { site_title, site_description, og_image, favicon_url, canonical_base_url, google_verification_code, google_analytics_id, search_console_verification, organization_name, contact_email, support_email, social_links } = req.body;
    const updates = [];
    const params = [];

    if (site_title !== undefined) { updates.push('site_title = ?'); params.push(site_title); }
    if (site_description !== undefined) { updates.push('site_description = ?'); params.push(site_description); }
    if (og_image !== undefined) { updates.push('og_image = ?'); params.push(og_image); }
    if (favicon_url !== undefined) { updates.push('favicon_url = ?'); params.push(favicon_url); }
    if (canonical_base_url !== undefined) { updates.push('canonical_base_url = ?'); params.push(canonical_base_url); }
    if (google_verification_code !== undefined) { updates.push('google_verification_code = ?'); params.push(google_verification_code); }
    if (google_analytics_id !== undefined) { updates.push('google_analytics_id = ?'); params.push(google_analytics_id); }
    if (search_console_verification !== undefined) { updates.push('search_console_verification = ?'); params.push(search_console_verification); }
    if (organization_name !== undefined) { updates.push('organization_name = ?'); params.push(organization_name); }
    if (contact_email !== undefined) { updates.push('contact_email = ?'); params.push(contact_email); }
    if (support_email !== undefined) { updates.push('support_email = ?'); params.push(support_email); }
    if (social_links !== undefined) { updates.push('social_links_json = ?'); params.push(JSON.stringify(social_links)); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(1);
      runSql(`UPDATE site_settings SET ${updates.join(', ')} WHERE id = 1`, params);
    }

    logAudit(req.user.id, 'SETTINGS_CHANGED', 'site_settings', 1, { changes: req.body }, req);

    const updated = queryOne('SELECT * FROM site_settings WHERE id = 1');
    updated.social_links = JSON.parse(updated.social_links_json || '{}');
    saveDb();

    res.json({ success: true, data: updated, message: 'Settings updated' });
  } catch (error) {
    console.error('UPDATE_SETTINGS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

exports.getSeoSettings = (req, res) => {
  try {
    let settings = queryOne('SELECT * FROM seo_settings WHERE id = 1');
    if (!settings) {
      runSql("INSERT INTO seo_settings (id) VALUES (1)");
      settings = queryOne('SELECT * FROM seo_settings WHERE id = 1');
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GET_SEO_SETTINGS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load SEO settings' });
  }
};

exports.updateSeoSettings = (req, res) => {
  try {
    let settings = queryOne('SELECT * FROM seo_settings WHERE id = 1');
    if (!settings) {
      runSql("INSERT INTO seo_settings (id) VALUES (1)");
    }

    const { homepage_title, homepage_description, pricing_title, pricing_description, features_title, features_description, about_title, about_description } = req.body;
    const updates = [];
    const params = [];

    if (homepage_title !== undefined) { updates.push('homepage_title = ?'); params.push(homepage_title); }
    if (homepage_description !== undefined) { updates.push('homepage_description = ?'); params.push(homepage_description); }
    if (pricing_title !== undefined) { updates.push('pricing_title = ?'); params.push(pricing_title); }
    if (pricing_description !== undefined) { updates.push('pricing_description = ?'); params.push(pricing_description); }
    if (features_title !== undefined) { updates.push('features_title = ?'); params.push(features_title); }
    if (features_description !== undefined) { updates.push('features_description = ?'); params.push(features_description); }
    if (about_title !== undefined) { updates.push('about_title = ?'); params.push(about_title); }
    if (about_description !== undefined) { updates.push('about_description = ?'); params.push(about_description); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(1);
      runSql(`UPDATE seo_settings SET ${updates.join(', ')} WHERE id = 1`, params);
    }

    logAudit(req.user.id, 'SEO_SETTINGS_CHANGED', 'seo_settings', 1, { changes: req.body }, req);

    const updated = queryOne('SELECT * FROM seo_settings WHERE id = 1');
    saveDb();

    res.json({ success: true, data: updated, message: 'SEO settings updated' });
  } catch (error) {
    console.error('UPDATE_SEO_SETTINGS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update SEO settings' });
  }
};

exports.getAdSettings = (req, res) => {
  try {
    let settings = queryOne('SELECT * FROM ad_settings WHERE id = 1');
    if (!settings) {
      runSql("INSERT INTO ad_settings (id) VALUES (1)");
      settings = queryOne('SELECT * FROM ad_settings WHERE id = 1');
    }
    settings.ad_positions = JSON.parse(settings.ad_positions_json || '{}');
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('GET_AD_SETTINGS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load ad settings' });
  }
};

exports.updateAdSettings = (req, res) => {
  try {
    let settings = queryOne('SELECT * FROM ad_settings WHERE id = 1');
    if (!settings) {
      runSql("INSERT INTO ad_settings (id) VALUES (1)");
    }

    const { adsense_client_id, adsense_enabled, ad_positions } = req.body;
    const updates = [];
    const params = [];

    if (adsense_client_id !== undefined) { updates.push('adsense_client_id = ?'); params.push(adsense_client_id); }
    if (adsense_enabled !== undefined) { updates.push('adsense_enabled = ?'); params.push(adsense_enabled ? 1 : 0); }
    if (ad_positions !== undefined) { updates.push('ad_positions_json = ?'); params.push(JSON.stringify(ad_positions)); }

    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(1);
      runSql(`UPDATE ad_settings SET ${updates.join(', ')} WHERE id = 1`, params);
    }

    logAudit(req.user.id, 'AD_SETTINGS_CHANGED', 'ad_settings', 1, { changes: req.body }, req);

    const updated = queryOne('SELECT * FROM ad_settings WHERE id = 1');
    updated.ad_positions = JSON.parse(updated.ad_positions_json || '{}');
    saveDb();

    res.json({ success: true, data: updated, message: 'Ad settings updated' });
  } catch (error) {
    console.error('UPDATE_AD_SETTINGS_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update ad settings' });
  }
};

exports.getLegalPages = (req, res) => {
  try {
    const pages = queryAll('SELECT * FROM legal_pages ORDER BY updated_at DESC');
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('GET_LEGAL_PAGES_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to load legal pages' });
  }
};

exports.updateLegalPage = (req, res) => {
  try {
    const { page } = req.params;
    const { title, content, status } = req.body;

    const existing = queryOne('SELECT * FROM legal_pages WHERE page_slug = ?', [page]);

    if (existing) {
      const updates = [];
      const params = [];
      if (title !== undefined) { updates.push('title = ?'); params.push(title); }
      if (content !== undefined) { updates.push('content = ?'); params.push(content); }
      if (status !== undefined) { updates.push('status = ?'); params.push(status); }
      updates.push("updated_by = ?");
      params.push(req.user.id);
      updates.push("updated_at = datetime('now')");
      updates.push("version = version + 1");
      params.push(page);

      runSql(`UPDATE legal_pages SET ${updates.join(', ')} WHERE page_slug = ?`, params);

      const updated = queryOne('SELECT * FROM legal_pages WHERE page_slug = ?', [page]);
      runSql(
        'INSERT INTO legal_page_versions (page_slug, title, content, version, created_by, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))',
        [page, updated.title, updated.content, updated.version, req.user.id]
      );

      logAudit(req.user.id, 'LEGAL_PAGE_UPDATED', 'legal_pages', existing.id, { slug: page, version: updated.version }, req);
      saveDb();

      return res.json({ success: true, data: updated, message: 'Legal page updated' });
    } else {
      const result = runSql(
        'INSERT INTO legal_pages (page_slug, title, content, status, version, updated_by, updated_at) VALUES (?, ?, ?, ?, 1, ?, datetime(\'now\'))',
        [page, title || page, content || '', status || 'draft', req.user.id]
      );

      runSql(
        'INSERT INTO legal_page_versions (page_slug, title, content, version, created_by, created_at) VALUES (?, ?, ?, 1, ?, datetime(\'now\'))',
        [page, title || page, content || '', req.user.id]
      );

      const created = queryOne('SELECT * FROM legal_pages WHERE id = ?', [result.lastInsertRowid]);
      logAudit(req.user.id, 'LEGAL_PAGE_UPDATED', 'legal_pages', result.lastInsertRowid, { slug: page, version: 1 }, req);
      saveDb();

      return res.status(201).json({ success: true, data: created, message: 'Legal page created' });
    }
  } catch (error) {
    console.error('UPDATE_LEGAL_PAGE_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to update legal page' });
  }
};

exports.grantEntitlement = (req, res) => {
  try {
    const { user_id, plan_slug, duration_days, reason } = req.body;

    if (!user_id || !plan_slug) {
      return res.status(400).json({ success: false, message: 'user_id and plan_slug are required' });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'A reason is required (minimum 3 characters)' });
    }

    const user = queryOne('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const planConfig = getPlan(plan_slug);
    if (!planConfig) return res.status(404).json({ success: false, message: 'Plan not found' });

    const dbPlan = queryOne('SELECT id FROM plans WHERE slug = ?', [plan_slug]);
    if (!dbPlan) return res.status(404).json({ success: false, message: 'Plan not in database' });

    const existing = queryOne("SELECT id FROM subscriptions WHERE user_id = ? AND status IN ('active','pending')", [user_id]);
    if (existing) {
      runSql("UPDATE subscriptions SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [existing.id]);
    }

    const expiresAt = duration_days
      ? new Date(Date.now() + duration_days * 86400000).toISOString().split('T')[0]
      : (planConfig.recurring ? null : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);

    runSql(
      `INSERT INTO subscriptions (user_id, plan_id, provider, status, currency, amount, started_at, expires_at, created_at, updated_at)
       VALUES (?, ?, 'admin', 'active', 'INR', 0, datetime('now'), ?, datetime('now'), datetime('now'))`,
      [user_id, dbPlan.id, expiresAt]
    );

    runSql(
      `INSERT INTO billing_payments (user_id, plan_id, provider, provider_payment_id, currency, amount, status, payment_type, paid_at, created_at)
       VALUES (?, ?, 'admin', 'admin_grant', 'INR', 0, 'completed', 'admin_grant', datetime('now'), datetime('now'))`,
      [user_id, dbPlan.id]
    );

    logAudit(req.user.id, 'ENTITLEMENT_GRANTED', 'user', user_id, { plan_slug, duration_days, expires_at: expiresAt, reason: reason.trim() }, req);
    saveDb();

    res.json({ success: true, message: `Entitlement granted: ${plan_slug}` });
  } catch (error) {
    console.error('GRANT_ENTITLEMENT_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to grant entitlement' });
  }
};

exports.revokeEntitlement = (req, res) => {
  try {
    const { user_id, reason } = req.body;

    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id is required' });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'A reason is required (minimum 3 characters)' });
    }

    const user = queryOne('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const sub = queryOne("SELECT id, plan_id FROM subscriptions WHERE user_id = ? AND status IN ('active','pending')", [user_id]);
    if (!sub) {
      return res.status(404).json({ success: false, message: 'No active subscription found' });
    }

    const plan = queryOne('SELECT slug FROM plans WHERE id = ?', [sub.plan_id]);
    runSql("UPDATE subscriptions SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?", [sub.id]);

    logAudit(req.user.id, 'ENTITLEMENT_REVOKED', 'user', user_id, { subscription_id: sub.id, plan_slug: plan ? plan.slug : null, reason: reason.trim() }, req);
    saveDb();

    res.json({ success: true, message: 'Entitlement revoked' });
  } catch (error) {
    console.error('REVOKE_ENTITLEMENT_ERROR', error);
    res.status(500).json({ success: false, message: 'Failed to revoke entitlement' });
  }
};
