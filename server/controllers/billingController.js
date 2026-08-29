const crypto = require('crypto');
const https = require('https');
const { queryAll, queryOne, runSql, saveDb } = require('../database/database');
const { CURRENCIES, PLAN_DEFINITIONS, getPlan, getPrice } = require('../config/billing');
const { getUserPlan, getUserEntitlements, getUsage, ensureFreeSubscription } = require('../services/billingService');

const SUPPORTED_STATES = ['active', 'authenticated', 'pending', 'paused', 'cancelled', 'completed', 'halted', 'expired', 'failed'];
const ZERO_DECIMAL = new Set(['JPY', 'KRW']);

function minorUnits(amount, currency) { return Math.round(amount * (ZERO_DECIMAL.has(currency) ? 1 : 100)); }
function safeCurrency(value) { const currency = String(value || '').toUpperCase(); return CURRENCIES.includes(currency) ? currency : null; }

function razorpayConfigured() { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET); }

function razorpayRequest(method, endpoint, body) {
  if (!razorpayConfigured()) return Promise.reject(Object.assign(new Error('Payments are not configured'), { statusCode: 503 }));
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const request = https.request({ hostname: 'api.razorpay.com', path: `/v1${endpoint}`, method, headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }, (response) => {
      let raw = '';
      response.on('data', (chunk) => { raw += chunk; });
      response.on('end', () => {
        let data;
        try { data = JSON.parse(raw); } catch (error) { return reject(Object.assign(new Error('Invalid payment provider response'), { statusCode: 502 })); }
        if (response.statusCode < 200 || response.statusCode >= 300) return reject(Object.assign(new Error(data.error?.description || 'Payment provider request failed'), { statusCode: 502 }));
        resolve(data);
      });
    });
    request.on('error', () => reject(Object.assign(new Error('Payment provider unavailable'), { statusCode: 503 })));
    request.write(JSON.stringify(body));
    request.end();
  });
}

function planResponse(plan) {
  return { slug: plan.slug, name: plan.name, recurring: plan.recurring, interval: plan.interval || null, storageBytes: plan.storageBytes, prices: plan.prices, limits: plan.limits || null };
}

exports.getPlans = (req, res) => res.json({ success: true, data: { currencies: CURRENCIES, plans: PLAN_DEFINITIONS.map(planResponse), razorpayConfigured: razorpayConfigured() } });

exports.getSubscription = (req, res) => {
  const current = getUserPlan(req.user.id);
  res.json({ success: true, data: { subscription: current.subscription, plan: planResponse(current.plan), entitlements: getUserEntitlements(req.user.id) } });
};

exports.getUsage = (req, res) => {
  const current = getUserPlan(req.user.id);
  res.json({ success: true, data: { usage: getUsage(req.user.id), limits: current.plan.limits || { clients: null, activeProjects: null, tasks: null, invoicesMonthly: null, videoUploadsMonthly: null }, storageBytes: current.plan.storageBytes } });
};

exports.getBillingPayments = (req, res) => res.json({ success: true, data: queryAll('SELECT bp.*, p.name as plan_name FROM billing_payments bp JOIN plans p ON p.id = bp.plan_id WHERE bp.user_id = ? ORDER BY bp.created_at DESC', [req.user.id]) });

function validateCheckout(req) {
  const slug = String(req.body.plan_slug || '');
  const currency = safeCurrency(req.body.currency);
  const plan = getPlan(slug);
  const price = getPrice(slug, currency);
  if (!PLAN_DEFINITIONS.some((item) => item.slug === slug) || slug === 'free') return { error: 'Invalid paid plan' };
  if (!currency || price === null) return { error: 'This currency is not available for the selected plan' };
  return { slug, currency, plan, price };
}

exports.createOrder = async (req, res, next) => {
  try {
    const checkout = validateCheckout(req);
    if (checkout.error) return res.status(400).json({ success: false, message: checkout.error });
    if (checkout.plan.recurring) return res.status(400).json({ success: false, message: 'Use subscription checkout for recurring plans' });
    const planRow = queryOne('SELECT id FROM plans WHERE slug = ?', [checkout.slug]);
    const order = await razorpayRequest('POST', '/orders', { amount: minorUnits(checkout.price, checkout.currency), currency: checkout.currency, receipt: `cr_${req.user.id}_${Date.now()}`, notes: { user_id: String(req.user.id), plan_slug: checkout.slug } });
    runSql('INSERT INTO billing_payments (user_id, plan_id, provider, provider_order_id, currency, amount, status, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, planRow.id, 'razorpay', order.id, checkout.currency, checkout.price, 'created', 'lifetime']);
    saveDb();
    res.status(201).json({ success: true, data: { order, keyId: process.env.RAZORPAY_KEY_ID, plan: checkout.slug, currency: checkout.currency, amount: checkout.price } });
  } catch (error) { next(error); }
};

exports.createSubscription = async (req, res, next) => {
  try {
    const checkout = validateCheckout(req);
    if (checkout.error) return res.status(400).json({ success: false, message: checkout.error });
    if (!checkout.plan.recurring) return res.status(400).json({ success: false, message: 'Use order checkout for lifetime plans' });
    const providerPlanId = process.env[`RAZORPAY_PLAN_ID_${checkout.currency}_${checkout.plan.interval.toUpperCase()}`];
    if (!providerPlanId) return res.status(503).json({ success: false, message: 'Recurring payments are not configured for this currency' });
    const planRow = queryOne('SELECT id FROM plans WHERE slug = ?', [checkout.slug]);
    const subscription = await razorpayRequest('POST', '/subscriptions', { plan_id: providerPlanId, total_count: checkout.plan.interval === 'monthly' ? 120 : checkout.plan.interval === 'quarterly' ? 40 : 10, customer_notify: 1, notes: { user_id: String(req.user.id), plan_slug: checkout.slug, currency: checkout.currency } });
    runSql('INSERT INTO subscriptions (user_id, plan_id, provider, provider_subscription_id, status, currency, amount) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.user.id, planRow.id, 'razorpay', subscription.id, 'pending', checkout.currency, checkout.price]);
    saveDb();
    res.status(201).json({ success: true, data: { subscription, keyId: process.env.RAZORPAY_KEY_ID, plan: checkout.slug, currency: checkout.currency, amount: checkout.price } });
  } catch (error) { next(error); }
};

function verifyHmac(payload, signature) {
  const expected = Buffer.from(payload, 'utf8');
  const received = Buffer.from(signature || '', 'utf8');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

exports.verifyPayment = (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const payment = queryOne('SELECT bp.*, p.slug FROM billing_payments bp JOIN plans p ON p.id = bp.plan_id WHERE bp.provider_order_id = ? AND bp.user_id = ?', [razorpay_order_id, req.user.id]);
    if (!payment || payment.status === 'paid') return res.status(400).json({ success: false, message: 'Payment order not found or already processed' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (!razorpay_signature || !verifyHmac(expected, razorpay_signature)) return res.status(400).json({ success: false, message: 'Payment verification failed' });
    const subscription = ensureFreeSubscription(req.user.id);
    runSql('UPDATE billing_payments SET provider_payment_id = ?, subscription_id = ?, status = ?, paid_at = datetime(\'now\') WHERE id = ?', [razorpay_payment_id, subscription.id, 'paid', payment.id]);
    const lifetime = queryOne('SELECT id FROM plans WHERE slug = ?', ['lifetime']);
    runSql('UPDATE subscriptions SET plan_id = ?, provider = ?, currency = ?, amount = ?, status = ?, expires_at = NULL, updated_at = datetime(\'now\') WHERE id = ?', [lifetime.id, 'razorpay', payment.currency, payment.amount, 'active', subscription.id]);
    saveDb();
    res.json({ success: true, data: { paymentId: razorpay_payment_id, plan: 'lifetime', status: 'active', amount: payment.amount, currency: payment.currency } });
  } catch (error) { next(error); }
};

exports.verifySubscription = (req, res, next) => {
  try {
    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
    const subscription = queryOne('SELECT s.*, p.slug FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.provider_subscription_id = ? AND s.user_id = ?', [razorpay_subscription_id, req.user.id]);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${razorpay_payment_id}|${razorpay_subscription_id}`).digest('hex');
    if (!razorpay_signature || !verifyHmac(expected, razorpay_signature)) return res.status(400).json({ success: false, message: 'Subscription verification failed' });
    runSql('UPDATE subscriptions SET status = ?, current_period_start = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?', ['active', subscription.id]);
    runSql('INSERT INTO billing_payments (user_id, plan_id, subscription_id, provider, provider_payment_id, currency, amount, status, payment_type, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))', [req.user.id, subscription.plan_id, subscription.id, 'razorpay', razorpay_payment_id, subscription.currency, subscription.amount, 'paid', 'subscription']);
    saveDb();
    res.json({ success: true, data: { paymentId: razorpay_payment_id, plan: subscription.slug, status: 'active' } });
  } catch (error) { next(error); }
};

exports.cancelSubscription = (req, res, next) => {
  try {
    const subscription = queryOne('SELECT * FROM subscriptions WHERE id = ? AND user_id = ? AND provider = ?', [req.params.id, req.user.id, 'razorpay']);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    if (!subscription.provider_subscription_id) return res.status(400).json({ success: false, message: 'Subscription is not managed by Razorpay' });
    razorpayRequest('POST', `/subscriptions/${encodeURIComponent(subscription.provider_subscription_id)}/cancel`, { cancel_at_cycle_end: 1 }).then(() => {
      runSql('UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = datetime(\'now\') WHERE id = ?', [subscription.id]); saveDb(); res.json({ success: true, data: { id: subscription.id, cancelAtPeriodEnd: true } });
    }).catch(next);
  } catch (error) { next(error); }
};

exports.webhook = (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !req.rawBody) return res.status(400).json({ success: false, message: 'Webhook verification failed' });
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  if (!verifyHmac(expected, signature)) return res.status(400).json({ success: false, message: 'Webhook verification failed' });
  let event;
  try { event = JSON.parse(req.rawBody.toString('utf8')); } catch (error) { return res.status(400).json({ success: false, message: 'Invalid webhook payload' }); }
  const eventId = event.id;
  if (!eventId || !event.event) return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
  try {
    const inserted = runSql('INSERT OR IGNORE INTO webhook_events (provider, event_id, event_type, payload_hash) VALUES (?, ?, ?, ?)', ['razorpay', eventId, event.event, crypto.createHash('sha256').update(req.rawBody).digest('hex')]);
    if (inserted.changes === 0) return res.json({ success: true, data: { duplicate: true } });
    const entity = event.payload?.subscription?.entity || event.payload?.payment?.entity;
    const providerSubscriptionId = entity?.subscription_id || entity?.id;
    const state = { 'subscription.activated': 'active', 'subscription.authenticated': 'authenticated', 'subscription.pending': 'pending', 'subscription.paused': 'paused', 'subscription.cancelled': 'cancelled', 'subscription.completed': 'completed', 'subscription.halted': 'halted', 'subscription.expired': 'expired', 'subscription.charged': 'active', 'payment.failed': 'failed' }[event.event];
    if (state && providerSubscriptionId) runSql('UPDATE subscriptions SET status = ?, updated_at = datetime(\'now\') WHERE provider_subscription_id = ?', [SUPPORTED_STATES.includes(state) ? state : 'pending', providerSubscriptionId]);
    saveDb();
    res.json({ success: true, data: { processed: true } });
  } catch (error) { res.status(500).json({ success: false, message: 'Webhook processing failed' }); }
};

exports.getConfig = () => ({ razorpayConfigured: razorpayConfigured() });
