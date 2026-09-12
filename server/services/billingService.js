const { queryAll, queryOne, runSql, saveDb } = require('../database/database');
const { PLAN_DEFINITIONS, CURRENCIES, getPlan, isPro } = require('../config/billing');

function ensurePlans() {
  PLAN_DEFINITIONS.forEach((plan) => {
    const existing = queryOne('SELECT id FROM plans WHERE slug = ?', [plan.slug]);
    if (existing) {
      runSql('UPDATE plans SET name = ?, active = 1, recurring = ?, interval = ?, storage_bytes = ?, prices_json = ? WHERE slug = ?', [plan.name, plan.recurring ? 1 : 0, plan.interval || null, plan.storageBytes, JSON.stringify(plan.prices), plan.slug]);
    } else {
      runSql('INSERT INTO plans (slug, name, active, recurring, interval, storage_bytes, prices_json) VALUES (?, ?, 1, ?, ?, ?, ?)', [plan.slug, plan.name, plan.recurring ? 1 : 0, plan.interval || null, plan.storageBytes, JSON.stringify(plan.prices)]);
    }
  });
  runSql("UPDATE plans SET active = 0 WHERE slug NOT IN ('free', 'pro_monthly', 'pro_quarterly', 'pro_yearly')");
}

function ensureFreeSubscription(userId, currency) {
  ensurePlans();
  const freePlan = queryOne('SELECT id FROM plans WHERE slug = ?', ['free']);
  if (!freePlan) {
    console.error('[Billing] CRITICAL: Free plan not found in plans table');
    throw new Error('Free plan not configured in database');
  }
  const userCurrency = (currency && CURRENCIES.includes(String(currency).toUpperCase())) ? String(currency).toUpperCase() : 'INR';
  let existing = queryOne(
    'SELECT s.*, p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.user_id = ? AND p.slug = ? AND s.status = ?',
    [userId, 'free', 'active']
  );
  if (existing) return existing;
  const result = runSql(
    'INSERT INTO subscriptions (user_id, plan_id, provider, status, currency, amount, started_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))',
    [userId, freePlan.id, 'local', 'active', userCurrency, 0]
  );
  saveDb();
  return queryOne('SELECT s.*, p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.id = ?', [result.lastInsertRowid]);
}

function archiveSubscriptionsForEmail(userId, email) {
  const paid = queryAll(`SELECT s.*, p.slug, p.interval
    FROM subscriptions s JOIN plans p ON p.id = s.plan_id
    WHERE s.user_id = ? AND p.slug != 'free'
      AND (s.status IN ('active', 'authenticated')
        OR (s.status = 'cancelled' AND s.cancel_at_period_end = 1 AND s.current_period_end > datetime('now')))` , [userId]);
  if (!paid.length) return;
  runSql('INSERT INTO subscription_recovery (email, subscription_json) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET subscription_json = excluded.subscription_json, created_at = datetime(\'now\')', [String(email).trim().toLowerCase(), JSON.stringify(paid[0])]);
}

function restoreSubscriptionForEmail(userId, email) {
  const recovery = queryOne('SELECT * FROM subscription_recovery WHERE email = ?', [String(email).trim().toLowerCase()]);
  if (!recovery) return false;
  let saved;
  try { saved = JSON.parse(recovery.subscription_json); } catch (error) { return false; }
  const plan = queryOne('SELECT id FROM plans WHERE slug = ?', [saved.slug]);
  if (!plan) return false;
  runSql(`INSERT INTO subscriptions
    (user_id, plan_id, provider, provider_subscription_id, provider_plan_id, status, currency, amount,
     current_period_start, current_period_end, cancel_at_period_end, started_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    userId, plan.id, saved.provider || 'razorpay', saved.provider_subscription_id || null,
    saved.provider_plan_id || null, saved.status, saved.currency || 'INR', saved.amount || 0,
    saved.current_period_start || null, saved.current_period_end || null,
    saved.cancel_at_period_end || 0, saved.started_at || null, saved.expires_at || null,
  ]);
  runSql('DELETE FROM subscription_recovery WHERE id = ?', [recovery.id]);
  return true;
}

function resolveEffectiveSubscription(userId) {
  ensurePlans();
  const allSubs = queryAll('SELECT s.*, p.slug, p.name as plan_name, p.recurring, p.interval, p.storage_bytes, p.prices_json FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.user_id = ? ORDER BY s.id DESC', [userId]);
  if (!allSubs.length) return ensureFreeSubscription(userId);
  const now = new Date().toISOString();
  for (const s of allSubs) {
    if (s.slug === 'lifetime') {
      if (s.status === 'active') return s;
      continue;
    }
    if (s.status === 'active' || s.status === 'authenticated') {
      if (s.cancel_at_period_end && s.current_period_end && s.current_period_end < now) continue;
      if (s.expires_at && s.expires_at < now) continue;
      return s;
    }
    if (s.status === 'cancelled' && s.cancel_at_period_end && s.current_period_end && s.current_period_end > now) return s;
  }
  return ensureFreeSubscription(userId);
}

const LEGACY_LIFETIME_PLAN = { slug: 'lifetime', name: 'Lifetime', recurring: false, storageBytes: 50e9, limits: undefined, prices: {} };

function getUserPlan(userId) {
  const subscription = resolveEffectiveSubscription(userId);
  const planRow = queryOne('SELECT * FROM plans WHERE id = ?', [subscription.plan_id]);
  const plan = planRow?.slug === 'lifetime' ? LEGACY_LIFETIME_PLAN : getPlan(planRow?.slug);
  return { subscription, plan, planRow };
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

module.exports = { ensurePlans, ensureFreeSubscription, archiveSubscriptionsForEmail, restoreSubscriptionForEmail, resolveEffectiveSubscription, getUserPlan: getUserPlan, getEffectiveSubscription: (userId) => resolveEffectiveSubscription(userId), getEffectivePlan: (userId) => getUserPlan(userId).plan, getUserEntitlements, getUsage, checkLimit, hasFeature, CURRENCIES };
