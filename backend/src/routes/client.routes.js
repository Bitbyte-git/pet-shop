const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getClients, getClientById, createClient, updateClient, searchClients } = require('../controllers/client.controller');

router.use(protect);

router.get('/search', searchClients);
router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);

module.exports = router;
