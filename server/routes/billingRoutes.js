const express = require('express');
const { protect } = require('../middleware/auth');
const billing = require('../controllers/billingController');

const router = express.Router();
router.get('/plans', billing.getPlans);
router.post('/webhook/razorpay', billing.webhook);
router.use(protect);
router.get('/subscription', billing.getSubscription);
router.get('/usage', billing.getUsage);
router.get('/payments', billing.getBillingPayments);
router.post('/validate-coupon', billing.validateCoupon);
router.post('/create-order', billing.createOrder);
router.post('/create-subscription', billing.createSubscription);
router.post('/verify-payment', billing.verifyPayment);
router.post('/verify-subscription', billing.verifySubscription);
router.post('/subscription/:id/cancel', billing.cancelSubscription);
module.exports = router;
