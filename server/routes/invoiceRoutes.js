const express = require('express');
const { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.route('/').get(getInvoices).post(createInvoice);
router.route('/:id').get(getInvoiceById).put(updateInvoice).delete(deleteInvoice);
module.exports = router;
