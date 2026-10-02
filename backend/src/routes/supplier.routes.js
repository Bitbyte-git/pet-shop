const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getSuppliers, createSupplier, updateSupplier } = require('../controllers/supplier.controller');

router.use(protect);
router.get('/', getSuppliers);
router.post('/', authorize('ADMIN'), createSupplier);
router.put('/:id', authorize('ADMIN'), updateSupplier);

module.exports = router;
