const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Client = require('../models/Client');
const Pet = require('../models/Pet');
const Product = require('../models/Product');
const ProductBilling = require('../models/ProductBilling');
const ClinicBilling = require('../models/ClinicBilling');
const InventoryTransaction = require('../models/InventoryTransaction');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const User = require('../models/User');
const { getTodayStats, getCombinedBillingHistory } = require('../services/billing.service');

router.use(protect);

router.get('/admin', async (req, res) => {
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    totalPets,
    totalProducts,
    totalSuppliers,
    totalPurchases,
    billingManagers,
    products,
    todayStats,
    recentClients,
    recentHistory,
  ] = await Promise.all([
    Client.countDocuments({ status: 'ACTIVE' }),
    Pet.countDocuments({ status: 'ACTIVE' }),
    Product.countDocuments({ status: 'ACTIVE' }),
    Supplier.countDocuments({ status: 'ACTIVE' }),
    Purchase.countDocuments(),
    User.find({ role: 'BILLING_MANAGER' }).select('-password'),
    Product.find({ status: 'ACTIVE' }),
    getTodayStats(),
    Client.find({ status: 'ACTIVE' }).sort({ createdAt: -1 }).limit(5),
    getCombinedBillingHistory({ limit: 10 }),
  ]);

  const lowStockProducts = products.filter((p) => p.currentStock <= p.reorderLevel && p.currentStock > 0);
  const outOfStockProducts = products.filter((p) => p.currentStock === 0);
  const expiringSoon = products.filter((p) => p.expiryDate && new Date(p.expiryDate) <= ninetyDaysLater && new Date(p.expiryDate) >= now);
  const expired = products.filter((p) => p.expiryDate && new Date(p.expiryDate) < now);
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);

  // Compute activity per Billing Manager
  const bmActivity = await Promise.all(
    billingManagers.map(async (bm) => {
      const [productBills, clinicBills] = await Promise.all([
        ProductBilling.find({ createdBy: bm._id }),
        ClinicBilling.find({ createdBy: bm._id }),
      ]);
      const productSales = productBills.reduce((s, b) => s + b.grandTotal, 0);
      const clinicSales = clinicBills.reduce((s, b) => s + b.totalAmount, 0);
      return {
        _id: bm._id,
        name: bm.name,
        email: bm.email,
        phone: bm.phone,
        status: bm.status,
        totalBills: productBills.length + clinicBills.length,
        totalSales: productSales + clinicSales,
        createdAt: bm.createdAt,
      };
    })
  );

  res.json({
    success: true,
    stats: {
      totalClients,
      totalPets,
      totalProducts,
      totalSuppliers,
      totalPurchases,
      totalStockValue: parseFloat(totalStockValue.toFixed(2)),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
      todayBills: todayStats.totalBills,
      todaySales: todayStats.totalSales,
      todayProductSales: todayStats.totalProductSales,
      todayClinicSales: todayStats.totalClinicSales,
      todayGST: todayStats.totalGST,
      billingManagersCount: billingManagers.length,
    },
    recentClients,
    recentBills: recentHistory.bills,
    bmActivity,
    lowStockProducts: lowStockProducts.slice(0, 5).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode,
      currentStock: p.currentStock, reorderLevel: p.reorderLevel,
    })),
    expiringSoonProducts: expiringSoon.slice(0, 5).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode,
      expiryDate: p.expiryDate,
      daysUntilExpiry: Math.ceil((new Date(p.expiryDate) - now) / (1000 * 60 * 60 * 24)),
    })),
  });
});

router.get('/billing-manager', async (req, res) => {
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [
    todayStats,
    recentHistory,
    totalClients,
    totalProducts,
    products,
    recentTransactions,
  ] = await Promise.all([
    getTodayStats(),
    getCombinedBillingHistory({ limit: 10 }),
    Client.countDocuments({ status: 'ACTIVE' }),
    Product.countDocuments({ status: 'ACTIVE' }),
    Product.find({ status: 'ACTIVE' }),
    InventoryTransaction.find().sort({ createdAt: -1 }).limit(6).populate('performedBy', 'name'),
  ]);

  const lowStock = products.filter((p) => p.currentStock <= p.reorderLevel && p.currentStock > 0);
  const expiring = products.filter((p) => p.expiryDate && new Date(p.expiryDate) <= ninetyDaysLater && new Date(p.expiryDate) >= now);

  // Compute 7-day sales trend summary
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const [pBills, cBills] = await Promise.all([
      ProductBilling.find({ createdAt: { $gte: d, $lte: end }, paymentStatus: 'PAID' }),
      ClinicBilling.find({ createdAt: { $gte: d, $lte: end }, status: 'ACTIVE' }),
    ]);

    const pSales = pBills.reduce((s, b) => s + b.grandTotal, 0);
    const cSales = cBills.reduce((s, b) => s + b.totalAmount, 0);

    last7Days.push({
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      productSales: pSales,
      clinicSales: cSales,
      totalSales: pSales + cSales,
      count: pBills.length + cBills.length,
    });
  }

  res.json({
    success: true,
    stats: {
      todayBills: todayStats.totalBills,
      todaySales: todayStats.totalSales,
      todayProductBills: todayStats.totalProductBills,
      todayProductSales: todayStats.totalProductSales,
      todayClinicBills: todayStats.totalClinicBills,
      todayClinicSales: todayStats.totalClinicSales,
      todayGST: todayStats.totalGST,
      totalCustomers: totalClients,
      totalProducts,
      lowStockCount: lowStock.length,
      expiringSoonCount: expiring.length,
    },
    recentBills: recentHistory.bills,
    recentTransactions: recentTransactions.map((t) => ({
      _id: t._id,
      productName: t.productName,
      productCode: t.productCode,
      type: t.type,
      quantity: t.quantity,
      performedByName: t.performedByName || t.performedBy?.name || 'System',
      createdAt: t.createdAt,
    })),
    lowStockAlerts: lowStock.slice(0, 5).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode, currentStock: p.currentStock, reorderLevel: p.reorderLevel,
    })),
    expiringProducts: expiring.slice(0, 5).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode, expiryDate: p.expiryDate,
      daysUntilExpiry: Math.ceil((new Date(p.expiryDate) - now) / (1000 * 60 * 60 * 24)),
    })),
    salesAnalytics: last7Days,
  });
});

module.exports = router;
