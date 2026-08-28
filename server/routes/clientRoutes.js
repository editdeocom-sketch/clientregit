const express = require('express');
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
router.route('/').get(getClients).post(createClient);
router.route('/:id').get(getClientById).put(updateClient).delete(deleteClient);
module.exports = router;
