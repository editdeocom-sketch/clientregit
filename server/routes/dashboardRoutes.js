const express = require('express');
const { getStats, getRevisions } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.get('/stats', getStats);
router.get('/revisions', getRevisions);
module.exports = router;
