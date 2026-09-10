const express = require('express');
const router = express.Router();
const controller = require('../controllers/publicPageController');

// Public routes
router.get('/legal/:slug', controller.getPage);
router.get('/seo-meta', controller.getSeoMeta);

module.exports = router;
