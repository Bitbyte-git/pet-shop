const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createProductBill, getProductBills, getCombinedBillingHistory,
  getProductBillById, getInvoicePDF,
} = require('../controllers/billing.controller');

router.use(protect);

router.get('/history', getCombinedBillingHistory);
router.get('/product', getProductBills);
router.post('/product', createProductBill);
router.get('/product/:id', getProductBillById);
router.get('/product/:id/pdf', getInvoicePDF);

module.exports = router;
