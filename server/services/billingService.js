const { queryAll, queryOne, runSql, saveDb } = require('../database/database');
const { PLAN_DEFINITIONS, CURRENCIES, getPlan, isPro } = require('../config/billing');

function ensurePlans() {
  PLAN_DEFINITIONS.forEach((plan) => runSql('INSERT OR IGNORE INTO plans (slug, name, active, recurring, interval, storage_bytes, prices_json) VALUES (?, ?, 1, ?, ?, ?, ?)', [plan.slug, plan.name, plan.recurring ? 1 : 0, plan.interval || null, plan.storageBytes, JSON.stringify(plan.prices)]));
}

function ensureFreeSubscription(userId) {
  ensurePlans();
  let subscription = queryOne('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
  if (!subscription) {
    const free = queryOne('SELECT id FROM plans WHERE slug = ?', ['free']);
    const result = runSql('INSERT INTO subscriptions (user_id, plan_id, provider, status, currency, amount, started_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))', [userId, free.id, 'local', 'active', 'INR', 0]);
    saveDb();
    subscription = queryOne('SELECT * FROM subscriptions WHERE id = ?', [result.lastInsertRowid]);
  }
  return subscription;
}

function getUserPlan(userId) {
  const subscription = ensureFreeSubscription(userId);
  const planRow = queryOne('SELECT * FROM plans WHERE id = ?', [subscription.plan_id]);
  return { subscription, plan: getPlan(planRow?.slug), planRow };
}

function getUserEntitlements(userId) {
  const { subscription, plan } = getUserPlan(userId);
  const pro = isPro(plan);
  return { plan: plan.slug, planName: plan.name, status: subscription.status, storageBytes: plan.storageBytes, limits: pro ? { clients: null, activeProjects: null, tasks: null, invoicesMonthly: null, videoUploadsMonthly: null } : plan.limits, features: { professionalInvoice: pro, branding: pro, advancedDashboard: pro, csvExport: pro, clientPortal: pro, shareableVideoLinks: pro, multipleVideoVersions: pro, advancedReports: pro } };
}

function getUsage(userId) {
  const storage = queryOne('SELECT COALESCE(SUM(file_size), 0) as bytes FROM videos WHERE uploaded_by = ?', [userId]);
  const uploads = queryOne("SELECT COUNT(*) as count FROM videos WHERE uploaded_by = ? AND created_at >= date('now', 'start of month')", [userId]);
  const invoices = queryOne("SELECT COUNT(*) as count FROM invoices WHERE created_by = ? AND created_at >= date('now', 'start of month')", [userId]);
  return { clients: queryOne('SELECT COUNT(*) as count FROM clients WHERE created_by = ?', [userId]).count, activeProjects: queryOne("SELECT COUNT(*) as count FROM projects WHERE created_by = ? AND status NOT IN ('completed','delivered','cancelled')", [userId]).count, tasks: queryOne('SELECT COUNT(*) as count FROM tasks WHERE created_by = ?', [userId]).count, invoicesMonthly: invoices.count, videoUploadsMonthly: uploads.count, storageBytes: storage.bytes };
}

function checkLimit(userId, resource, additional = 1) {
  const entitlements = getUserEntitlements(userId);
  const usage = getUsage(userId);
  if (resource === 'storageBytes') return { allowed: usage.storageBytes + additional <= entitlements.storageBytes, entitlements, usage, limit: entitlements.storageBytes };
  const limit = entitlements.limits[resource];
  if (limit !== null && usage[resource] + additional > limit) return { allowed: false, entitlements, usage, limit };
  return { allowed: true, entitlements, usage, limit };
}

function hasFeature(userId, featureName) {
  const entitlements = getUserEntitlements(userId);
  return entitlements.features[featureName] === true;
}

module.exports = { ensurePlans, ensureFreeSubscription, getUserPlan, getUserEntitlements, getUsage, checkLimit, hasFeature, CURRENCIES };
