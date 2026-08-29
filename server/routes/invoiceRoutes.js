const express = require('express');
const { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { enforceLimit } = require('../middleware/billing');
const router = express.Router();
router.use(protect);
router.route('/').get(getInvoices).post(enforceLimit('invoicesMonthly'), createInvoice);
router.route('/:id').get(getInvoiceById).put(updateInvoice).delete(deleteInvoice);
module.exports = router;
