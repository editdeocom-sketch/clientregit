const crypto = require('crypto');
const https = require('https');
const { queryAll, queryOne, runSql, saveDb } = require('../database/database');
const { CURRENCIES, PLAN_DEFINITIONS, getPlan, getPrice } = require('../config/billing');
const { getUserPlan, getUserEntitlements, getUsage, ensureFreeSubscription } = require('../services/billingService');

const ZERO_DECIMAL = new Set(['JPY', 'KRW']);

function minorUnits(amount, currency) { return Math.round(amount * (ZERO_DECIMAL.has(currency) ? 1 : 100)); }
function safeCurrency(value) { const currency = String(value || '').toUpperCase(); return CURRENCIES.includes(currency) ? currency : null; }
function razorpayConfigured() { return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET); }

function razorpayRequest(method, endpoint, body) {
  if (!razorpayConfigured()) return Promise.reject(Object.assign(new Error('Payments are not configured'), { statusCode: 503 }));
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const options = { hostname: 'api.razorpay.com', path: `/v1${endpoint}`, method, headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } };
    const request = https.request(options, (response) => {
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
    if (body) request.write(JSON.stringify(body));
    request.end();
  });
}

function planResponse(plan) {
  return { slug: plan.slug, name: plan.name, recurring: plan.recurring, interval: plan.interval || null, storageBytes: plan.storageBytes, prices: plan.prices, limits: plan.limits || null };
}

function validateCoupon(code, planSlug, currency, userId) {
  if (!code) return null;
  const coupon = queryOne('SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND active = 1', [code.trim()]);
  if (!coupon) return { error: 'Invalid coupon code' };
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) return { error: 'This coupon has expired' };
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { error: 'This coupon has reached its usage limit' };
  if (coupon.currency && coupon.currency !== currency) return { error: 'This coupon is not valid for this currency' };
  if (coupon.plan_slugs) {
    const allowed = coupon.plan_slugs.split(',').map(s => s.trim());
    if (!allowed.includes(planSlug)) return { error: 'This coupon is not valid for this plan' };
  }
  const existing = queryOne('SELECT id FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?', [coupon.id, userId]);
  if (existing) return { error: 'You have already used this coupon' };
  return { coupon };
}

function calculateDiscount(coupon, amount) {
  if (!coupon) return 0;
  if (coupon.discount_type === 'percent') return Math.round(amount * coupon.discount_value / 100 * 100) / 100;
  return Math.min(coupon.discount_value, amount);
}

function finalizeCouponRedemption(couponId, userId, orderId, discountAmount) {
  const coupon = queryOne('SELECT * FROM coupons WHERE id = ? AND active = 1', [couponId]);
  if (!coupon) return false;
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return false;
  const existing = queryOne('SELECT id FROM coupon_redemptions WHERE coupon_id = ? AND user_id = ?', [couponId, userId]);
  if (existing) return true;
  const redemption = runSql('INSERT OR IGNORE INTO coupon_redemptions (coupon_id, user_id, order_id, discount_amount) VALUES (?, ?, ?, ?)', [couponId, userId, orderId, discountAmount]);
  if (redemption.changes > 0) {
    runSql('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [couponId]);
    return true;
  }
  return false;
}

function verifyHmac(payload, signature) {
  if (!signature) return false;
  const expected = Buffer.from(payload, 'hex');
  const received = Buffer.from(signature, 'hex');
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

exports.validateCoupon = (req, res, next) => {
  try {
    const { code, plan_slug, currency } = req.body;
    if (!code || !plan_slug || !currency) return res.status(400).json({ success: false, message: 'code, plan_slug, and currency are required' });
    const plan = getPlan(plan_slug);
    if (plan.recurring) return res.status(400).json({ success: false, message: 'Coupons are currently available for one-time purchases only.' });
    const result = validateCoupon(code, plan_slug, currency, req.user.id);
    if (result?.error) return res.status(400).json({ success: false, message: result.error });
    const price = getPrice(plan_slug, currency);
    const discount = calculateDiscount(result.coupon, price);
    const finalAmount = Math.max(0, price - discount);
    res.json({ success: true, data: { code: result.coupon.code, description: result.coupon.description, discountType: result.coupon.discount_type, discountValue: result.coupon.discount_value, originalPrice: price, discountAmount: discount, finalAmount, currency } });
  } catch (error) { next(error); }
};

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
    let coupon = null, discount = 0;
    if (req.body.coupon_code) {
      const result = validateCoupon(req.body.coupon_code, checkout.slug, checkout.currency, req.user.id);
      if (result?.error) return res.status(400).json({ success: false, message: result.error });
      coupon = result.coupon;
      discount = calculateDiscount(coupon, checkout.price);
    }
    const finalAmount = Math.max(1, Math.round((checkout.price - discount) * (ZERO_DECIMAL.has(checkout.currency) ? 1 : 100)) / (ZERO_DECIMAL.has(checkout.currency) ? 1 : 100));
    const planRow = queryOne('SELECT id FROM plans WHERE slug = ?', [checkout.slug]);
    const order = await razorpayRequest('POST', '/orders', { amount: minorUnits(finalAmount, checkout.currency), currency: checkout.currency, receipt: `cr_${req.user.id}_${Date.now()}`, notes: { user_id: String(req.user.id), plan_slug: checkout.slug, coupon: coupon?.code || '' } });
    runSql('INSERT INTO billing_payments (user_id, plan_id, provider, provider_order_id, currency, amount, original_amount, status, payment_type, coupon_code, discount_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, planRow.id, 'razorpay', order.id, checkout.currency, finalAmount, checkout.price, 'created', 'lifetime', coupon?.code || null, discount]);
    saveDb();
    res.status(201).json({ success: true, data: { order, keyId: process.env.RAZORPAY_KEY_ID, plan: checkout.slug, currency: checkout.currency, amount: finalAmount, originalPrice: checkout.price, discount, couponCode: coupon?.code || null } });
  } catch (error) { next(error); }
};

exports.createSubscription = async (req, res, next) => {
  try {
    const checkout = validateCheckout(req);
    if (checkout.error) return res.status(400).json({ success: false, message: checkout.error });
    if (!checkout.plan.recurring) return res.status(400).json({ success: false, message: 'Use order checkout for lifetime plans' });
    if (req.body.coupon_code) return res.status(400).json({ success: false, message: 'Coupons are currently available for one-time purchases only.' });
    const existingActive = queryOne("SELECT id FROM subscriptions WHERE user_id = ? AND status IN ('active','authenticated','pending')", [req.user.id]);
    if (existingActive) return res.status(400).json({ success: false, message: 'You already have an active subscription. Cancel it before subscribing to a new plan.' });
    const providerPlanId = process.env[`RAZORPAY_PLAN_ID_${checkout.currency}_${checkout.plan.interval.toUpperCase()}`];
    if (!providerPlanId) return res.status(503).json({ success: false, message: 'Recurring payments are not currently available in ' + checkout.currency + '.' });
    const planRow = queryOne('SELECT id FROM plans WHERE slug = ?', [checkout.slug]);
    const subscription = await razorpayRequest('POST', '/subscriptions', { plan_id: providerPlanId, total_count: checkout.plan.interval === 'monthly' ? 120 : checkout.plan.interval === 'quarterly' ? 40 : 10, customer_notify: 1, notes: { user_id: String(req.user.id), plan_slug: checkout.slug, currency: checkout.currency } });
    runSql('INSERT INTO subscriptions (user_id, plan_id, provider, provider_subscription_id, provider_plan_id, status, currency, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [req.user.id, planRow.id, 'razorpay', subscription.id, providerPlanId, 'pending', checkout.currency, checkout.price]);
    saveDb();
    res.status(201).json({ success: true, data: { subscription, keyId: process.env.RAZORPAY_KEY_ID, plan: checkout.slug, currency: checkout.currency, amount: checkout.price, originalPrice: checkout.price, discount: 0, couponCode: null } });
  } catch (error) { next(error); }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, message: 'Missing required payment verification fields' });
    const payment = queryOne('SELECT bp.*, p.slug FROM billing_payments bp JOIN plans p ON p.id = bp.plan_id WHERE bp.provider_order_id = ? AND bp.user_id = ?', [razorpay_order_id, req.user.id]);
    if (!payment) return res.status(400).json({ success: false, message: 'Payment order not found' });
    if (payment.status === 'paid') {
      const existingSub = queryOne('SELECT s.*, p.slug FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.id = ?', [payment.subscription_id]);
      return res.json({ success: true, data: { paymentId: razorpay_payment_id, plan: existingSub?.slug || payment.slug, status: 'active', amount: payment.amount, currency: payment.currency } });
    }
    if (payment.status !== 'created') return res.status(400).json({ success: false, message: 'Payment is not in a verifiable state' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (!verifyHmac(expected, razorpay_signature)) return res.status(400).json({ success: false, message: 'Payment verification failed' });
    let rzpOrder;
    try {
      rzpOrder = await razorpayRequest('GET', `/orders/${razorpay_order_id}`);
    } catch (e) {
      return res.status(502).json({ success: false, message: 'Unable to verify payment with the payment provider. Please try again.' });
    }
    const expectedAmount = minorUnits(payment.amount, payment.currency);
    if (rzpOrder.amount !== expectedAmount) return res.status(400).json({ success: false, message: 'Payment amount mismatch' });
    if (rzpOrder.currency !== payment.currency) return res.status(400).json({ success: false, message: 'Payment currency mismatch' });
    let rzpPayment;
    try {
      rzpPayment = await razorpayRequest('GET', `/payments/${razorpay_payment_id}`);
    } catch (e) {
      return res.status(502).json({ success: false, message: 'Unable to verify payment with the payment provider. Please try again.' });
    }
    if (rzpPayment.order_id !== razorpay_order_id) return res.status(400).json({ success: false, message: 'Payment does not belong to this order' });
    if (rzpPayment.captured !== true && rzpPayment.status !== 'captured') return res.status(400).json({ success: false, message: 'Payment has not been captured' });
    if (rzpPayment.amount !== expectedAmount) return res.status(400).json({ success: false, message: 'Payment amount mismatch' });
    if (rzpPayment.currency !== payment.currency) return res.status(400).json({ success: false, message: 'Payment currency mismatch' });
    const planRow = queryOne('SELECT * FROM plans WHERE id = ?', [payment.plan_id]);
    if (!planRow) return res.status(500).json({ success: false, message: 'Plan not found' });
    const subscription = ensureFreeSubscription(req.user.id, payment.currency);
    runSql('UPDATE billing_payments SET provider_payment_id = ?, subscription_id = ?, status = ?, paid_at = datetime(\'now\') WHERE id = ?', [razorpay_payment_id, subscription.id, 'paid', payment.id]);
    runSql('UPDATE subscriptions SET plan_id = ?, provider = ?, currency = ?, amount = ?, status = ?, expires_at = NULL, updated_at = datetime(\'now\') WHERE id = ?', [planRow.id, 'razorpay', payment.currency, payment.amount, 'active', subscription.id]);
    if (payment.coupon_code) {
      const coupon = queryOne('SELECT id FROM coupons WHERE UPPER(code) = UPPER(?)', [payment.coupon_code]);
      if (coupon) finalizeCouponRedemption(coupon.id, req.user.id, razorpay_order_id, payment.discount_amount);
    }
    saveDb();
    res.json({ success: true, data: { paymentId: razorpay_payment_id, plan: planRow.slug, status: 'active', amount: payment.amount, currency: payment.currency } });
  } catch (error) { next(error); }
};

exports.verifySubscription = async (req, res, next) => {
  try {
    const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ success: false, message: 'Missing required subscription verification fields' });
    const subscription = queryOne('SELECT s.*, p.slug FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.provider_subscription_id = ? AND s.user_id = ?', [razorpay_subscription_id, req.user.id]);
    if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
    if (subscription.status === 'active') return res.json({ success: true, data: { paymentId: razorpay_payment_id, plan: subscription.slug, status: 'active' } });
    if (subscription.status !== 'pending') return res.status(400).json({ success: false, message: 'Subscription is not in a verifiable state' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(`${razorpay_payment_id}|${razorpay_subscription_id}`).digest('hex');
    if (!verifyHmac(expected, razorpay_signature)) return res.status(400).json({ success: false, message: 'Subscription verification failed' });
    let rzpSubscription;
    try {
      rzpSubscription = await razorpayRequest('GET', `/subscriptions/${razorpay_subscription_id}`);
    } catch (e) {
      return res.status(502).json({ success: false, message: 'Unable to verify subscription with the payment provider. Please try again.' });
    }
    if (!subscription.provider_plan_id) {
      return res.status(400).json({ success: false, message: 'Subscription is missing provider plan information' });
    }
    if (rzpSubscription.plan_id !== subscription.provider_plan_id) {
      return res.status(400).json({ success: false, message: 'Subscription plan mismatch' });
    }
    const validStatuses = ['active', 'authenticated'];
    if (!validStatuses.includes(rzpSubscription.status)) {
      return res.status(400).json({ success: false, message: 'Subscription is not active with the payment provider' });
    }
    const rzpCurrency = safeCurrency(rzpSubscription.currency || subscription.currency);
    if (rzpCurrency && rzpCurrency !== subscription.currency) {
      return res.status(400).json({ success: false, message: 'Subscription currency mismatch' });
    }
    const intervalMap = { monthly: '+1 month', quarterly: '+3 months', yearly: '+1 year' };
    const periodEndSql = intervalMap[subscription.interval || 'monthly'] || '+1 month';
    runSql(`UPDATE subscriptions SET status = ?, current_period_start = datetime('now'), current_period_end = datetime('now', ?), updated_at = datetime('now') WHERE id = ?`, ['active', periodEndSql, subscription.id]);
    const existingPayment = queryOne('SELECT id FROM billing_payments WHERE provider_payment_id = ?', [razorpay_payment_id]);
    if (!existingPayment) {
      runSql('INSERT INTO billing_payments (user_id, plan_id, subscription_id, provider, provider_payment_id, currency, amount, original_amount, status, payment_type, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))', [req.user.id, subscription.plan_id, subscription.id, 'razorpay', razorpay_payment_id, subscription.currency, subscription.amount, subscription.amount, 'paid', 'subscription']);
    }
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
    const subEntity = event.payload?.subscription?.entity;
    const paymentEntity = event.payload?.payment?.entity;
    const providerSubscriptionId = subEntity?.id || paymentEntity?.subscription_id;
    const eventType = event.event;
    const statusMap = {
      'subscription.activated': 'active',
      'subscription.authenticated': 'active',
      'subscription.pending': 'pending',
      'subscription.paused': 'paused',
      'subscription.cancelled': 'cancelled',
      'subscription.completed': 'completed',
      'subscription.halted': 'halted',
      'subscription.expired': 'expired',
      'subscription.charged': 'active',
      'payment.failed': 'failed',
    };
    const newStatus = statusMap[eventType];
    if (newStatus && providerSubscriptionId) {
      const sub = queryOne('SELECT id, user_id, plan_id, currency, amount FROM subscriptions WHERE provider_subscription_id = ?', [providerSubscriptionId]);
      if (!sub) return res.status(200).json({ success: true, data: { processed: true, note: 'Subscription not found in database' } });
      const subFull = queryOne('SELECT provider_plan_id FROM subscriptions WHERE provider_subscription_id = ?', [providerSubscriptionId]);
      if (!subFull?.provider_plan_id) {
        console.warn(`[Webhook] Subscription ${providerSubscriptionId} missing provider_plan_id. Skipping billing action.`);
        runSql(`UPDATE subscriptions SET status = ?, updated_at = datetime('now') WHERE provider_subscription_id = ?`, [newStatus, providerSubscriptionId]);
        return res.status(200).json({ success: true, data: { processed: true, note: 'Missing provider plan — skipped billing' } });
      }
      if (!subEntity?.plan_id || subEntity.plan_id !== subFull.provider_plan_id) {
        console.warn(`[Webhook] Plan mismatch for ${providerSubscriptionId}: expected ${subFull.provider_plan_id}, got ${subEntity?.plan_id || 'missing'}. Skipping.`);
        return res.status(200).json({ success: true, data: { processed: true, note: 'Plan mismatch — skipped' } });
      }
      const rzpCurrency = subEntity?.currency ? safeCurrency(subEntity.currency) : null;
      if (!rzpCurrency) {
        console.warn(`[Webhook] Missing or invalid currency for ${providerSubscriptionId}. Skipping billing action.`);
        runSql(`UPDATE subscriptions SET status = ?, updated_at = datetime('now') WHERE provider_subscription_id = ?`, [newStatus, providerSubscriptionId]);
        return res.status(200).json({ success: true, data: { processed: true, note: 'Missing currency — skipped billing' } });
      }
      if (rzpCurrency !== sub.currency) {
        console.warn(`[Webhook] Currency mismatch for ${providerSubscriptionId}: expected ${sub.currency}, got ${rzpCurrency}. Skipping.`);
        return res.status(200).json({ success: true, data: { processed: true, note: 'Currency mismatch — skipped' } });
      }
      if (eventType === 'subscription.charged') {
        if (!paymentEntity) {
          console.warn(`[Webhook] subscription.charged missing payment entity for ${providerSubscriptionId}. Skipping.`);
          return res.status(200).json({ success: true, data: { processed: true, note: 'Missing payment entity — skipped' } });
        }
        const existingPayment = queryOne('SELECT id FROM billing_payments WHERE provider_payment_id = ?', [paymentEntity.id]);
        if (existingPayment) {
          return res.status(200).json({ success: true, data: { processed: true, note: 'Duplicate payment — skipped' } });
        }
        const paymentCurrency = safeCurrency(paymentEntity.currency);
        if (!paymentCurrency || paymentCurrency !== sub.currency) {
          console.warn(`[Webhook] subscription.charged payment currency mismatch for ${paymentEntity.id}: expected ${sub.currency}, got ${paymentCurrency || 'missing'}. Skipping.`);
          return res.status(200).json({ success: true, data: { processed: true, note: 'Payment currency mismatch — skipped' } });
        }
        if (typeof paymentEntity.amount !== 'number') {
          console.warn(`[Webhook] subscription.charged missing or invalid amount for ${paymentEntity.id}. Skipping.`);
          return res.status(200).json({ success: true, data: { processed: true, note: 'Missing payment amount — skipped' } });
        }
        const expectedAmountMinor = minorUnits(sub.amount, sub.currency);
        if (paymentEntity.amount !== expectedAmountMinor) {
          console.warn(`[Webhook] subscription.charged amount mismatch for ${paymentEntity.id}: expected ${expectedAmountMinor}, got ${paymentEntity.amount}. Skipping.`);
          return res.status(200).json({ success: true, data: { processed: true, note: 'Payment amount mismatch — skipped' } });
        }
      }
      const updateFields = ['status = ?', 'updated_at = datetime(\'now\')'];
      const updateParams = [newStatus];
      if (eventType === 'subscription.charged' && subEntity?.current_end) {
        const endDate = new Date(subEntity.current_end * 1000).toISOString();
        updateFields.push('current_period_start = datetime(\'now\')');
        updateFields.push('current_period_end = ?');
        updateParams.push(endDate);
      }
      updateParams.push(providerSubscriptionId);
      runSql(`UPDATE subscriptions SET ${updateFields.join(', ')} WHERE provider_subscription_id = ?`, updateParams);
      if (eventType === 'subscription.charged' && paymentEntity) {
        runSql('INSERT INTO billing_payments (user_id, plan_id, subscription_id, provider, provider_payment_id, currency, amount, original_amount, status, payment_type, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))', [sub.user_id, sub.plan_id, sub.id, 'razorpay', paymentEntity.id, sub.currency, sub.amount, sub.amount, 'paid', 'subscription']);
      }
    }
    if (eventType === 'payment.failed' && paymentEntity) {
      const billingPayment = queryOne('SELECT id, user_id FROM billing_payments WHERE provider_payment_id = ?', [paymentEntity.id]);
      if (billingPayment) {
        runSql('UPDATE billing_payments SET status = ? WHERE provider_payment_id = ?', ['failed', paymentEntity.id]);
      }
      if (providerSubscriptionId) {
        const sub = queryOne('SELECT id, user_id FROM subscriptions WHERE provider_subscription_id = ?', [providerSubscriptionId]);
        if (sub) {
          runSql('UPDATE subscriptions SET status = ?, updated_at = datetime(\'now\') WHERE id = ?', ['failed', sub.id]);
        }
      }
    }
    saveDb();
    res.json({ success: true, data: { processed: true } });
  } catch (error) { res.status(500).json({ success: false, message: 'Webhook processing failed' }); }
};

exports.getConfig = () => ({ razorpayConfigured: razorpayConfigured() });
