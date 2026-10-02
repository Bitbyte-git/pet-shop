const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createPurchase, getPurchases, getPurchaseById } = require('../controllers/purchase.controller');

router.use(protect);
router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', authorize('ADMIN'), createPurchase);

module.exports = router;
