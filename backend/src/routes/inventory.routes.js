const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getInventory, getLowStock, getExpiry, adjustStock, getTransactionHistory } = require('../controllers/inventory.controller');

router.use(protect);
router.get('/', getInventory);
router.get('/low-stock', getLowStock);
router.get('/expiry', getExpiry);
router.post('/adjustment', authorize('ADMIN', 'SUPER_ADMIN', 'BILLING_MANAGER'), adjustStock);
router.get('/history/:productId', getTransactionHistory);

module.exports = router;
