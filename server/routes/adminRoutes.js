const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, admin);

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/subscriptions', adminController.getSubscriptions);
router.get('/payments', adminController.getPayments);
router.get('/plans', adminController.getPlans);
router.put('/plans/:id', adminController.updatePlan);
router.get('/coupons', adminController.getCoupons);
router.post('/coupons', adminController.createCoupon);
router.put('/coupons/:id', adminController.updateCoupon);
router.put('/coupons/:id/toggle', adminController.toggleCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);
router.get('/storage', adminController.getStorage);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);
router.get('/seo', adminController.getSeoSettings);
router.put('/seo', adminController.updateSeoSettings);
router.get('/ads', adminController.getAdSettings);
router.put('/ads', adminController.updateAdSettings);
router.get('/legal', adminController.getLegalPages);
router.put('/legal/:page', adminController.updateLegalPage);
router.post('/entitlement/grant', adminController.grantEntitlement);
router.post('/entitlement/revoke', adminController.revokeEntitlement);

module.exports = router;
