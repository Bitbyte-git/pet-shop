const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getLowStockProducts, getExpiringProducts, searchProductsForBilling,
} = require('../controllers/product.controller');

router.use(protect);

router.get('/search', searchProductsForBilling);
router.get('/low-stock', getLowStockProducts);
router.get('/expiring', getExpiringProducts);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', authorize('ADMIN', 'SUPER_ADMIN', 'BILLING_MANAGER'), createProduct);
router.put('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'BILLING_MANAGER'), updateProduct);
router.delete('/:id', authorize('ADMIN', 'SUPER_ADMIN', 'BILLING_MANAGER'), deleteProduct);

module.exports = router;
