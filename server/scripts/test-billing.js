/**
 * ClientRegit Billing System Tests
 * Run: node server/scripts/test-billing.js
 *
 * Tests all billing scenarios against the actual codebase without starting the server.
 * Uses the sql.js database directly.
 */

const path = require('path');
const fs = require('fs');

const { CURRENCIES, PLAN_DEFINITIONS, getPlan, getPrice, isPro } = require('../config/billing');

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message}`); }
}

function assertEqual(actual, expected, message) {
  total++;
  if (actual === expected) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message} — expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)}`); }
}

function assertIncludes(str, substring, message) {
  total++;
  if (str && str.includes(substring)) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message} — "${String(str).slice(0, 100)}" does not include "${substring}"`); }
}

function assertNotIncludes(str, substring, message) {
  total++;
  if (!str || !str.includes(substring)) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.error(`  ✗ ${message} — found "${substring}" when it should not be present`); }
}

function section(name) { console.log(`\n=== ${name} ===`); }

// ===== PLAN DEFINITIONS =====
section('Plan Definitions');
assertEqual(PLAN_DEFINITIONS.length, 5, '5 plans defined');
assertEqual(getPlan('free').slug, 'free', 'Free plan exists');
assertEqual(getPlan('lifetime').slug, 'lifetime', 'Lifetime plan exists');
assertEqual(getPlan('pro_monthly').slug, 'pro_monthly', 'Pro Monthly plan exists');
assertEqual(getPlan('pro_quarterly').slug, 'pro_quarterly', 'Pro Quarterly plan exists');
assertEqual(getPlan('pro_yearly').slug, 'pro_yearly', 'Pro Yearly plan exists');
assert(getPlan('free').storageBytes === 1e9, 'Free: 1GB storage');
assert(getPlan('pro_monthly').storageBytes === 15e9, 'Pro: 15GB storage');
assert(getPlan('lifetime').storageBytes === 50e9, 'Lifetime: 50GB storage');
assert(!getPlan('free').recurring, 'Free: not recurring');
assert(!getPlan('lifetime').recurring, 'Lifetime: not recurring');
assert(getPlan('pro_monthly').recurring, 'Pro Monthly: recurring');
assert(getPlan('pro_quarterly').recurring, 'Pro Quarterly: recurring');
assert(getPlan('pro_yearly').recurring, 'Pro Yearly: recurring');
assert(isPro(getPlan('pro_monthly')), 'Pro Monthly isPro = true');
assert(!isPro(getPlan('free')), 'Free isPro = false');
assert(getPlan('nonexistent').slug === 'free', 'Unknown slug falls back to free');

// ===== CURRENCIES =====
section('Currencies');
assertEqual(CURRENCIES.length, 14, '14 currencies supported');
assert(CURRENCIES.includes('INR'), 'INR supported');
assert(CURRENCIES.includes('USD'), 'USD supported');
assert(CURRENCIES.includes('JPY'), 'JPY supported');
assert(CURRENCIES.includes('KRW'), 'KRW supported');

// ===== PRICES =====
section('Prices');
assertEqual(getPrice('lifetime', 'INR'), 10999, 'Lifetime INR price = 10999');
assertEqual(getPrice('lifetime', 'USD'), 149.99, 'Lifetime USD price = 149.99');
assertEqual(getPrice('pro_monthly', 'INR'), 599, 'Pro Monthly INR = 599');
assertEqual(getPrice('pro_yearly', 'INR'), 2999, 'Pro Yearly INR = 2999');
assertEqual(getPrice('pro_monthly', 'JPY'), 1200, 'Pro Monthly JPY = 1200');
assertEqual(getPrice('pro_monthly', 'INVALID'), null, 'Invalid currency returns null');
assertEqual(getPrice('free', 'INR'), null, 'Free plan has no price');

// ===== FREE LIMITS =====
section('Free Limits');
const freePlan = getPlan('free');
assertEqual(freePlan.limits.clients, 3, 'Free: 3 clients');
assertEqual(freePlan.limits.activeProjects, 10, 'Free: 10 active projects');
assertEqual(freePlan.limits.tasks, 10, 'Free: 10 tasks');
assertEqual(freePlan.limits.invoicesMonthly, 3, 'Free: 3 invoices/month');
assertEqual(freePlan.limits.videoUploadsMonthly, 5, 'Free: 5 video uploads/month');

// ===== PRO / LIFETIME LIMITS =====
section('Pro & Lifetime Limits');
assertEqual(getPlan('pro_monthly').limits, undefined, 'Pro: no limits key (unlimited)');
assertEqual(getPlan('lifetime').limits, undefined, 'Lifetime: no limits key (unlimited)');
assertEqual(getPlan('lifetime').storageBytes, 50e9, 'Lifetime: 50GB storage');

// ===== ENTITLEMENT LOGIC (Code Analysis) =====
section('Entitlement Logic (Code Review)');
const billingServiceCode = fs.readFileSync(path.join(__dirname, '..', 'services', 'billingService.js'), 'utf8');
assert(!billingServiceCode.includes("s.status === 'pending'\n      return s"), 'Pending does NOT return as Pro');
assertIncludes(billingServiceCode, "if (s.status === 'active' || s.status === 'authenticated')", 'Only active/authenticated returns as Pro');
assertIncludes(billingServiceCode, "if (s.status === 'cancelled' && s.cancel_at_period_end && s.current_period_end && s.current_period_end > now)", 'Cancelled only returns if period not expired');
assertIncludes(billingServiceCode, "if (s.slug === 'lifetime') {\n      if (s.status === 'active') return s;", 'Lifetime returns only if active');
assertIncludes(billingServiceCode, "return ensureFreeSubscription(userId)", 'Falls back to Free when no valid subscription');

// ===== BILLING CONTROLLER: PAYMENT VERIFICATION SECURITY =====
section('Payment Verification Security');
const billingCode = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'billingController.js'), 'utf8');

// #1 - Fail closed if Razorpay API fails
assertIncludes(billingCode, "Unable to verify payment with the payment provider. Please try again.", 'verifyPayment returns error when Razorpay order lookup fails');
assertNotIncludes(billingCode, "{ /* proceed without server-side order fetch if unavailable */ }", 'verifyPayment does NOT silently proceed on API failure');
assertIncludes(billingCode, "try {\n      rzpOrder = await razorpayRequest('GET', `/orders/${razorpay_order_id}`);\n    } catch (e) {\n      return res.status(502).json({ success: false, message: 'Unable to verify payment with the payment provider. Please try again.' });\n    }", 'verifyPayment fail-closes on order fetch error');

// #2 - Verify Razorpay order (amount, currency)
assertIncludes(billingCode, "const expectedAmount = minorUnits(payment.amount, payment.currency);", 'verifyPayment computes expected amount from DB');
assertIncludes(billingCode, "rzpOrder.amount !== expectedAmount", 'verifyPayment checks order amount matches DB');
assertIncludes(billingCode, "rzpOrder.currency !== payment.currency", 'verifyPayment checks order currency matches DB');

// #3 - Verify Razorpay payment (belongs to order, captured)
assertIncludes(billingCode, "rzpPayment.order_id !== razorpay_order_id", 'verifyPayment checks payment belongs to order');
assertIncludes(billingCode, "rzpPayment.captured !== true && rzpPayment.status !== 'captured'", 'verifyPayment checks payment is captured');
assertIncludes(billingCode, "rzpPayment.amount !== expectedAmount", 'verifyPayment checks payment amount matches');
assertIncludes(billingCode, "rzpPayment.currency !== payment.currency", 'verifyPayment checks payment currency matches');
assertIncludes(billingCode, "try {\n      rzpPayment = await razorpayRequest('GET', `/payments/${razorpay_payment_id}`);\n    } catch (e) {\n      return res.status(502).json({ success: false, message: 'Unable to verify payment with the payment provider. Please try again.' });\n    }", 'verifyPayment fail-closes on payment fetch error');

// #4 - Idempotency
assertIncludes(billingCode, "if (payment.status === 'paid')", 'verifyPayment returns existing data if already paid');
assertIncludes(billingCode, "existingSub?.slug || payment.slug", 'Returns existing subscription slug on duplicate');
assertIncludes(billingCode, "if (payment.status !== 'created') return res.status(400)", 'verifyPayment rejects non-created status');

// #5 - Coupon finalization only after full verification
const verifyPaymentSection = billingCode.substring(billingCode.indexOf('exports.verifyPayment'), billingCode.indexOf('exports.verifySubscription'));
assertIncludes(verifyPaymentSection, "const planRow = queryOne('SELECT * FROM plans WHERE id = ?', [payment.plan_id]);", 'Plan lookup after verification');
assertIncludes(verifyPaymentSection, "runSql('UPDATE billing_payments SET provider_payment_id", 'DB update after verification');
assertIncludes(verifyPaymentSection, "finalizeCouponRedemption(coupon.id, req.user.id, razorpay_order_id, payment.discount_amount)", 'Coupon finalized after all verifications');
const couponFinalizeIdx = verifyPaymentSection.indexOf('finalizeCouponRedemption');
const hmacIdx = verifyPaymentSection.indexOf('verifyHmac');
const orderVerifyIdx = verifyPaymentSection.indexOf('rzpOrder.amount');
const paymentVerifyIdx = verifyPaymentSection.indexOf('rzpPayment.order_id');
assert(hmacIdx < couponFinalizeIdx, 'HMAC verified before coupon finalized');
assert(orderVerifyIdx < couponFinalizeIdx, 'Order verified before coupon finalized');
assert(paymentVerifyIdx < couponFinalizeIdx, 'Payment verified before coupon finalized');

// ===== SUBSCRIPTION VERIFICATION SECURITY =====
section('Subscription Verification Security');
assertIncludes(billingCode, "if (subscription.status !== 'pending') return res.status(400).json({ success: false, message: 'Subscription is not in a verifiable state' })", 'verifySubscription rejects non-pending status');
assertIncludes(billingCode, "try {\n      rzpSubscription = await razorpayRequest('GET', `/subscriptions/${razorpay_subscription_id}`);\n    } catch (e) {\n      return res.status(502).json({ success: false, message: 'Unable to verify subscription with the payment provider. Please try again.' });\n    }", 'verifySubscription fail-closes on API failure');
assertIncludes(billingCode, "if (!validStatuses.includes(rzpSubscription.status))", 'verifySubscription checks provider subscription status');
assertIncludes(billingCode, "const validStatuses = ['active', 'authenticated'];", 'Only active/authenticated accepted from Razorpay');

// ===== WEBHOOK SECURITY =====
section('Webhook Security');
assertIncludes(billingCode, "INSERT OR IGNORE INTO webhook_events", 'Webhook uses idempotent insert');
assertIncludes(billingCode, "if (inserted.changes === 0) return res.json({ success: true, data: { duplicate: true } })", 'Duplicate webhook returns early');
assertIncludes(billingCode, "const sub = queryOne('SELECT id, user_id, plan_id, currency, amount FROM subscriptions WHERE provider_subscription_id = ?'", 'Webhook looks up subscription by provider ID');
assertIncludes(billingCode, "if (!sub) return res.status(200).json({ success: true, data: { processed: true, note: 'Subscription not found in database' } })", 'Webhook ignores unknown subscriptions');
assertIncludes(billingCode, "const billingPayment = queryOne('SELECT id, user_id FROM billing_payments WHERE provider_payment_id = ?', [paymentEntity.id])", 'Webhook payment.failed validates billing payment exists');
assertIncludes(billingCode, "const sub = queryOne('SELECT id, user_id FROM subscriptions WHERE provider_subscription_id = ?', [providerSubscriptionId])", 'Webhook payment.failed validates subscription exists');

// ===== WEBHOOK: PLAN VALIDATION FAIL CLOSED =====
section('Webhook: Plan Validation Fail Closed');
assertIncludes(billingCode, "if (!subFull?.provider_plan_id)", 'Webhook fails closed when provider_plan_id is missing');
assertIncludes(billingCode, "missing provider_plan_id", 'Webhook logs missing provider_plan_id warning');
const missingPlanIdx = billingCode.indexOf("missing provider_plan_id");
const afterMissingPlan = billingCode.substring(missingPlanIdx, missingPlanIdx + 400);
assert(afterMissingPlan.includes('Skipping'), 'Missing provider_plan_id message includes Skipping');
assert(afterMissingPlan.includes('return res.status(200)'), 'Missing provider_plan_id returns 200');
assert(!afterMissingPlan.includes('UPDATE subscriptions SET plan_id'), 'Missing provider_plan_id does NOT update plan');
assertIncludes(billingCode, "!subEntity?.plan_id || subEntity.plan_id !== subFull.provider_plan_id", 'Webhook detects plan_id mismatch OR missing plan_id');
assertIncludes(billingCode, "Plan mismatch — skipped", 'Webhook plan mismatch returns skipped note');
const planMismatchIdx2 = billingCode.indexOf("Plan mismatch — skipped");
assert(billingCode.substring(planMismatchIdx2 - 200, planMismatchIdx2).includes('return res.status(200)'), 'Plan mismatch returns 200');

// ===== WEBHOOK: CURRENCY VALIDATION FAIL CLOSED =====
section('Webhook: Currency Validation Fail Closed');
assertIncludes(billingCode, "if (!rzpCurrency)", 'Webhook fails closed when currency is missing or invalid');
assertIncludes(billingCode, "Missing or invalid currency", 'Webhook logs missing currency warning');
const missingCurrIdx = billingCode.indexOf("Missing or invalid currency");
const afterMissingCurr = billingCode.substring(missingCurrIdx, missingCurrIdx + 400);
assert(afterMissingCurr.includes('Skipping'), 'Missing currency message includes Skipping');
assert(afterMissingCurr.includes('return res.status(200)'), 'Missing currency returns 200');
assertIncludes(billingCode, "if (rzpCurrency !== sub.currency)", 'Webhook detects currency mismatch');
assertIncludes(billingCode, "Currency mismatch — skipped", 'Webhook currency mismatch returns skipped note');

// ===== WEBHOOK: SUBSCRIPTION.CHARGED FULL VALIDATION =====
section('Webhook: Charged Payment Full Validation');
assertIncludes(billingCode, "if (eventType === 'subscription.charged')", 'Webhook has subscription.charged branch');
const chargedIdx = billingCode.indexOf("if (eventType === 'subscription.charged')");
const chargedBlock = billingCode.substring(chargedIdx, billingCode.indexOf("const updateFields", chargedIdx));
assert(chargedBlock.includes('if (!paymentEntity)'), 'subscription.charged fails closed when payment entity missing');
assert(chargedBlock.includes('Missing payment entity'), 'subscription.charged logs missing payment entity');
assert(chargedBlock.includes('const existingPayment = queryOne'), 'subscription.charged checks for duplicate payment');
assert(chargedBlock.includes('Duplicate payment'), 'subscription.charged detects duplicate payment');
assert(chargedBlock.includes('const paymentCurrency = safeCurrency(paymentEntity.currency)'), 'subscription.charged reads payment currency from provider');
assert(chargedBlock.includes('!paymentCurrency || paymentCurrency !== sub.currency'), 'subscription.charged fails closed when payment currency missing or mismatched');
assert(chargedBlock.includes('Payment currency mismatch'), 'subscription.charged logs payment currency mismatch');
assert(chargedBlock.includes("typeof paymentEntity.amount !== 'number'"), 'subscription.charged fails closed when amount is missing/non-numeric');
assert(chargedBlock.includes('Missing payment amount'), 'subscription.charged logs missing amount');
assert(chargedBlock.includes('const expectedAmountMinor = minorUnits(sub.amount, sub.currency)'), 'subscription.charged computes expected amount from DB');
assert(chargedBlock.includes('paymentEntity.amount !== expectedAmountMinor'), 'subscription.charged checks payment amount matches DB');
assert(chargedBlock.includes('Payment amount mismatch'), 'subscription.charged logs amount mismatch');
assert(chargedBlock.includes('Skipping'), 'subscription.charged logs skip on mismatch');
assert(chargedBlock.includes('return res.status(200)'), 'subscription.charged returns 200 on mismatch');
assert(!chargedBlock.includes('UPDATE subscriptions SET plan_id'), 'subscription.charged does NOT update plan_id directly');

// ===== WEBHOOK: PAYMENT.FAILED PRESERVED =====
section('Webhook: Payment Failed Preserved');
assertIncludes(billingCode, "if (eventType === 'payment.failed' && paymentEntity)", 'Webhook has payment.failed branch');
assertIncludes(billingCode, "runSql('UPDATE billing_payments SET status = ? WHERE provider_payment_id = ?', ['failed', paymentEntity.id])", 'payment.failed updates billing payment status');
assertIncludes(billingCode, "runSql('UPDATE subscriptions SET status = ?, updated_at = datetime(\\'now\\') WHERE id = ?', ['failed', sub.id])", 'payment.failed updates subscription status');

// ===== DEFERRED COUPON REDEMPTION =====
section('Deferred Coupon Redemption');
const createOrderSection = billingCode.substring(billingCode.indexOf('exports.createOrder'), billingCode.indexOf('exports.createSubscription'));
assertNotIncludes(createOrderSection, 'INSERT OR IGNORE INTO coupon_redemptions', 'createOrder does NOT consume coupon');
assertNotIncludes(createOrderSection, 'UPDATE coupons SET used_count', 'createOrder does NOT increment used_count');

// ===== ATOMIC COUPON FINALIZATION =====
section('Atomic Coupon Finalization');
const finalizeStart = billingCode.indexOf('function finalizeCouponRedemption');
const finalizeEnd = billingCode.indexOf('exports.validateCoupon');
const finalizeCode = billingCode.substring(finalizeStart, finalizeEnd);
assertIncludes(finalizeCode, 'active = 1', 'finalizeCouponRedemption checks coupon is active');
assertIncludes(finalizeCode, 'used_count >= coupon.max_uses', 'finalizeCouponRedemption checks max_uses');
assertIncludes(finalizeCode, 'coupon_redemptions WHERE coupon_id = ? AND user_id = ?', 'finalizeCouponRedemption checks user has not redeemed');
assertIncludes(finalizeCode, 'INSERT OR IGNORE INTO coupon_redemptions', 'finalizeCouponRedemption uses INSERT OR IGNORE');
assertIncludes(finalizeCode, 'UPDATE coupons SET used_count = used_count + 1', 'finalizeCouponRedemption increments used_count');

// ===== BILLING PAYMENT AMOUNTS =====
section('Billing Payment Amounts');
assertIncludes(billingCode, 'original_amount', 'createOrder stores original_amount');
assertIncludes(billingCode, 'discount_amount', 'createOrder stores discount_amount');

// ===== CURRENCY VALIDATION =====
section('Currency Validation');
const authCode = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'authController.js'), 'utf8');
assertIncludes(authCode, "CURRENCIES.includes(String(currency).toUpperCase())", 'authController validates currency against CURRENCIES');

// ===== RECURRING COUPON BLOCKING =====
section('Recurring Coupon Blocking');
assertIncludes(billingCode, 'if (plan.recurring) return res.status(400)', 'validateCoupon rejects recurring plans');
assertIncludes(billingCode, "if (req.body.coupon_code) return res.status(400).json({ success: false, message: 'Coupons are currently available for one-time purchases only.' })", 'createSubscription rejects coupons for recurring plans');

// ===== RECURRING PRICE VALIDATION =====
section('Recurring Price Validation');
assertIncludes(billingCode, 'RAZORPAY_PLAN_ID_', 'createSubscription checks Razorpay plan ID');
assertIncludes(billingCode, 'Recurring payments are not currently available in', 'Returns proper error when Razorpay plan not configured');

// ===== DUPLICATE LIFETIME PREVENTION =====
section('Duplicate Lifetime Prevention');
assertIncludes(billingCode, "if (payment.status === 'paid')", 'verifyPayment returns existing data if already paid');

// ===== SECURITY: NO SECRETS IN CLIENT =====
section('Security: No Secrets in Client');
const clientDir = path.join(__dirname, '..', '..', 'client', 'src');
const clientFiles = [];
function findTsFiles(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) findTsFiles(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(f)) clientFiles.push(full);
  });
}
findTsFiles(clientDir);
let clientHasSecret = false;
clientFiles.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  if (/RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|JWT_SECRET|ADMIN_PASSWORD/.test(code)) {
    console.error(`  ✗ Secret found in client file: ${f}`);
    clientHasSecret = true; failed++; total++;
  }
});
if (!clientHasSecret) { passed++; total++; console.log('  ✓ No secrets found in client source code'); }

// ===== .gitignore =====
section('.gitignore');
const gitignore = fs.readFileSync(path.join(__dirname, '..', '..', '.gitignore'), 'utf8');
assertIncludes(gitignore, 'server/.env', '.gitignore excludes server/.env');
assertIncludes(gitignore, 'data/*.db', '.gitignore excludes database files');
assertIncludes(gitignore, 'uploads/', '.gitignore excludes uploads');
assertIncludes(gitignore, 'node_modules/', '.gitignore excludes node_modules');
assertIncludes(gitignore, 'backups/', '.gitignore excludes backups');
assertIncludes(gitignore, 'client/dist/', '.gitignore excludes client/dist');

// ===== .env.example =====
section('.env.example');
const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
assertIncludes(envExample, 'JWT_SECRET=', '.env.example has JWT_SECRET placeholder');
assertIncludes(envExample, 'RAZORPAY_KEY_SECRET=', '.env.example has RAZORPAY_KEY_SECRET placeholder');
assertIncludes(envExample, 'RAZORPAY_WEBHOOK_SECRET=', '.env.example has RAZORPAY_WEBHOOK_SECRET placeholder');
assertIncludes(envExample, 'ADMIN_PASSWORD=', '.env.example has ADMIN_PASSWORD placeholder');
assert(!envExample.includes('change_this_in_production'), '.env.example has no hardcoded JWT_SECRET');
assert(!envExample.includes('Admin@123'), '.env.example has no hardcoded ADMIN_PASSWORD');

// ===== DATABASE SCHEMA =====
section('Database Schema');
const dbCode = fs.readFileSync(path.join(__dirname, '..', 'database', 'database.js'), 'utf8');
assertIncludes(dbCode, 'billing_payments', 'billing_payments table exists');
assertIncludes(dbCode, 'subscriptions', 'subscriptions table exists');
assertIncludes(dbCode, 'coupons', 'coupons table exists');
assertIncludes(dbCode, 'coupon_redemptions', 'coupon_redemptions table exists');
assertIncludes(dbCode, 'plans', 'plans table exists');
assertIncludes(dbCode, 'original_amount', 'billing_payments has original_amount column');
assertIncludes(dbCode, 'coupon_code TEXT', 'billing_payments has coupon_code column');
assertIncludes(dbCode, 'discount_amount REAL', 'billing_payments has discount_amount column');
assertIncludes(dbCode, 'provider_order_id TEXT', 'billing_payments has provider_order_id column');
assertIncludes(dbCode, 'provider_payment_id TEXT', 'billing_payments has provider_payment_id column');
assertIncludes(dbCode, 'usage', 'usage table exists');
assertIncludes(dbCode, 'webhook_events', 'webhook_events table exists');
assertIncludes(dbCode, "UNIQUE(provider, event_id)", 'webhook_events has unique constraint');

// ===== MIGRATION SAFETY =====
section('Migration Safety');
assertIncludes(dbCode, "try { database.run(\"ALTER TABLE", 'Database uses safe migrations with try/catch');

// ===== DOWNGRADE (NO DATA LOSS) =====
section('Downgrade (No Data Loss)');
assertIncludes(authCode, 'DELETE FROM billing_payments', 'deleteAccount cleans billing_payments');
assertIncludes(authCode, 'DELETE FROM subscriptions', 'deleteAccount cleans subscriptions');
assertIncludes(authCode, 'DELETE FROM coupon_redemptions', 'deleteAccount cleans coupon_redemptions');

// ===== WEBHOOK IDEMPOTENCY =====
section('Webhook Idempotency');
assertIncludes(dbCode, "UNIQUE(provider, event_id)", 'webhook_events has unique constraint');
assertIncludes(billingCode, "INSERT OR IGNORE INTO webhook_events", 'Webhook uses INSERT OR IGNORE');
assertIncludes(billingCode, "if (inserted.changes === 0) return res.json({ success: true, data: { duplicate: true } })", 'Duplicate webhook returns early');

// ===== FRONTEND SECURITY =====
section('Frontend Security');
const checkoutCode = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'CheckoutPage.tsx'), 'utf8');
assertIncludes(checkoutCode, '!isRecurring && (', 'Coupon UI hidden for recurring plans');
const successCode = fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'src', 'pages', 'PaymentSuccessPage.tsx'), 'utf8');
assertIncludes(successCode, 'billingService.getSubscription()', 'PaymentSuccessPage fetches plan from backend');
assert(successCode.includes('params.get("plan")') && !successCode.includes('params.get("amount")'), 'PaymentSuccessPage does not trust amount from URL');

// ===== PAYMENT STATUS CHECKS =====
section('Payment Status Checks');
assertIncludes(billingCode, "if (payment.status !== 'created') return res.status(400).json({ success: false, message: 'Payment is not in a verifiable state' })", 'verifyPayment rejects non-created billing payment status');

// ===== ENSURE FREE SUBSCRIPTION FALLBACK (Round 5) =====
section('Ensure Free Subscription Fallback');
assertIncludes(billingServiceCode, "SELECT s.*, p.slug FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.user_id = ? AND p.slug = ? AND s.status = ?", 'ensureFreeSubscription queries for plan slug = free AND status = active');
assertNotIncludes(billingServiceCode, "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1", 'ensureFreeSubscription no longer uses fallback query');
assertIncludes(billingServiceCode, "if (existing) return existing", 'ensureFreeSubscription returns existing Free if found');
assertIncludes(billingServiceCode, "if (!freePlan) {\n    console.error", 'ensureFreeSubscription throws if Free plan not found');

// ===== PROVIDER PLAN ID (Round 5) =====
section('Provider Plan ID');
assertIncludes(dbCode, 'provider_plan_id TEXT', 'subscriptions has provider_plan_id column');
assertIncludes(billingCode, "INSERT INTO subscriptions (user_id, plan_id, provider, provider_subscription_id, provider_plan_id, status, currency, amount)", 'createSubscription stores provider_plan_id');
assertIncludes(billingCode, "providerPlanId", 'createSubscription uses providerPlanId variable');

// ===== SUBSCRIPTION VERIFICATION: PROVIDER PLAN MATCH (Round 5) =====
section('Subscription Verification: Provider Plan Match');
assertIncludes(billingCode, "if (!subscription.provider_plan_id)", 'verifySubscription rejects missing provider_plan_id');
assertIncludes(billingCode, "if (rzpSubscription.plan_id !== subscription.provider_plan_id)", 'verifySubscription rejects plan mismatch');
assertIncludes(billingCode, "const rzpCurrency = safeCurrency(rzpSubscription.currency || subscription.currency)", 'verifySubscription reads currency from provider response');
assertIncludes(billingCode, "if (rzpCurrency && rzpCurrency !== subscription.currency)", 'verifySubscription rejects currency mismatch');

// ===== SUBSCRIPTION VERIFICATION: IDEMPOTENCY =====
section('Subscription Verification: Idempotency');
assertIncludes(billingCode, "if (subscription.status === 'active') return res.json({ success: true, data: { paymentId: razorpay_payment_id, plan: subscription.slug, status: 'active' } })", 'verifySubscription returns existing active subscription (idempotent)');
const verifySubSection = billingCode.substring(billingCode.indexOf('exports.verifySubscription'), billingCode.indexOf('exports.cancelSubscription'));
assert(verifySubSection.includes('const existingPayment = queryOne(\'SELECT id FROM billing_payments WHERE provider_payment_id = ?\''), 'verifySubscription checks for existing billing payment');
assert(verifySubSection.includes('if (!existingPayment)'), 'verifySubscription only creates billing payment if not duplicate');

// ===== WEBHOOK: PLAN VALIDATION (Round 5) =====
section('Webhook: Plan Validation');
assertIncludes(billingCode, "if (!subFull?.provider_plan_id)", 'Webhook fails closed when provider_plan_id missing');
assertIncludes(billingCode, "missing provider_plan_id", 'Webhook logs missing provider_plan_id');
assertIncludes(billingCode, "!subEntity?.plan_id || subEntity.plan_id !== subFull.provider_plan_id", 'Webhook detects plan_id mismatch');
assertIncludes(billingCode, "Plan mismatch — skipped", 'Webhook plan mismatch returns skipped note');

// ===== WEBHOOK: CURRENCY VALIDATION (Round 5) =====
section('Webhook: Currency Validation');
assertIncludes(billingCode, "if (!rzpCurrency)", 'Webhook fails closed when currency missing');
assertIncludes(billingCode, "Missing or invalid currency", 'Webhook logs missing currency');
assertIncludes(billingCode, "Currency mismatch — skipped", 'Webhook currency mismatch returns skipped note');
assertIncludes(billingCode, "const paymentCurrency = safeCurrency(paymentEntity.currency)", 'Webhook charged event reads payment currency from provider');
assert(chargedBlock.includes('!paymentCurrency || paymentCurrency !== sub.currency'), 'Charged fails closed on payment currency');

// ===== RESOLVE EFFECTIVE SUBSCRIPTION: EXPIRED CHECK (Round 5) =====
section('Entitlement Logic: Expiry Checks');
assertIncludes(billingServiceCode, "if (s.cancel_at_period_end && s.current_period_end && s.current_period_end < now) continue", 'Cancelled subscription with expired period is skipped');
assertIncludes(billingServiceCode, "if (s.expires_at && s.expires_at < now) continue", 'Subscription with expired expires_at is skipped');

// ===== PRICE SECURITY: SERVER-SIDE AMOUNT (Round 5) =====
section('Price Security: Server-Side Amount');
assertNotIncludes(billingCode, "req.body.amount", 'verifyPayment does not trust amount from request body');
assertIncludes(billingCode, "const expectedAmount = minorUnits(payment.amount, payment.currency)", 'verifyPayment computes amount from DB, not request');

// ===== SUMMARY =====
console.log(`\n${'='.repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed, ${total} total`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) process.exit(1);
