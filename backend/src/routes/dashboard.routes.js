const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Client = require('../models/Client');
const Pet = require('../models/Pet');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
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

  // Sales by category analytics
  const categories = await ProductCategory.find({ status: 'ACTIVE' });
  const salesByCategory = await Promise.all(
    categories.map(async (cat) => {
      const catProducts = await Product.find({ category: cat._id, status: 'ACTIVE' }).select('_id');
      const productIds = catProducts.map(p => p._id);
      
      const productBills = await ProductBilling.find({
        'items.product': { $in: productIds },
        paymentStatus: 'PAID',
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      const totalSales = productBills.reduce((sum, bill) => {
        const catItems = bill.items.filter(item => productIds.includes(item.product));
        return sum + catItems.reduce((s, i) => s + (i.quantity * i.rate), 0);
      }, 0);
      
      return {
        categoryName: cat.name,
        sales: totalSales
      };
    })
  );

  // Stock distribution by category
  const stockByCategory = await Promise.all(
    categories.map(async (cat) => {
      const catProducts = await Product.find({ category: cat._id, status: 'ACTIVE' });
      const totalStock = catProducts.reduce((sum, p) => sum + p.currentStock, 0);
      const totalValue = catProducts.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0);
      
      return {
        categoryName: cat.name,
        stock: totalStock,
        value: totalValue
      };
    })
  );

  // 7-day sales trend for admin
  const salesTrend = [];
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

    salesTrend.push({
      date: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      productSales: pSales,
      clinicSales: cSales,
      totalSales: pSales + cSales,
    });
  }

  // Top selling products
  const productSalesMap = {};
  const recentProductBills = await ProductBilling.find({ paymentStatus: 'PAID' })
    .sort({ createdAt: -1 })
    .limit(50);
  
  recentProductBills.forEach(bill => {
    bill.items.forEach(item => {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productSalesMap[item.productName].quantity += item.quantity;
      productSalesMap[item.productName].revenue += item.quantity * item.rate;
    });
  });
  
  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

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
    lowStockProducts: lowStockProducts.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode,
      currentStock: p.currentStock, reorderLevel: p.reorderLevel,
      category: p.category,
      sellingPrice: p.sellingPrice,
    })),
    outOfStockProducts: outOfStockProducts.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode,
      currentStock: p.currentStock, reorderLevel: p.reorderLevel,
      category: p.category,
      sellingPrice: p.sellingPrice,
    })),
    expiringSoonProducts: expiringSoon.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode,
      expiryDate: p.expiryDate,
      daysUntilExpiry: Math.ceil((new Date(p.expiryDate) - now) / (1000 * 60 * 60 * 24)),
      currentStock: p.currentStock,
      category: p.category,
      sellingPrice: p.sellingPrice,
    })),
    expiredProducts: expired.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode,
      expiryDate: p.expiryDate,
      daysExpired: Math.ceil((now - new Date(p.expiryDate)) / (1000 * 60 * 60 * 24)),
      currentStock: p.currentStock,
      category: p.category,
      sellingPrice: p.sellingPrice,
    })),
    analytics: {
      salesByCategory,
      stockByCategory,
      salesTrend,
      topSellingProducts,
    },
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
  const outOfStock = products.filter((p) => p.currentStock === 0);
  const expiring = products.filter((p) => p.expiryDate && new Date(p.expiryDate) <= ninetyDaysLater && new Date(p.expiryDate) >= now);
  const expired = products.filter((p) => p.expiryDate && new Date(p.expiryDate) < now);

  // Sales by category for billing manager
  const categories = await ProductCategory.find({ status: 'ACTIVE' });
  const salesByCategory = await Promise.all(
    categories.map(async (cat) => {
      const catProducts = await Product.find({ category: cat._id, status: 'ACTIVE' }).select('_id');
      const productIds = catProducts.map(p => p._id);
      
      const productBills = await ProductBilling.find({
        'items.product': { $in: productIds },
        paymentStatus: 'PAID',
        createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
      });
      
      const totalSales = productBills.reduce((sum, bill) => {
        const catItems = bill.items.filter(item => productIds.includes(item.product));
        return sum + catItems.reduce((s, i) => s + (i.quantity * i.rate), 0);
      }, 0);
      
      return {
        categoryName: cat.name,
        sales: totalSales
      };
    })
  );

  // Stock distribution by category
  const stockByCategory = await Promise.all(
    categories.map(async (cat) => {
      const catProducts = await Product.find({ category: cat._id, status: 'ACTIVE' });
      const totalStock = catProducts.reduce((sum, p) => sum + p.currentStock, 0);
      const totalValue = catProducts.reduce((sum, p) => sum + (p.currentStock * p.sellingPrice), 0);
      
      return {
        categoryName: cat.name,
        stock: totalStock,
        value: totalValue
      };
    })
  );

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
      outOfStockCount: outOfStock.length,
      expiringSoonCount: expiring.length,
      expiredCount: expired.length,
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
    lowStockAlerts: lowStock.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode, currentStock: p.currentStock, reorderLevel: p.reorderLevel,
      category: p.category, sellingPrice: p.sellingPrice,
    })),
    outOfStockAlerts: outOfStock.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode, currentStock: p.currentStock, reorderLevel: p.reorderLevel,
      category: p.category, sellingPrice: p.sellingPrice,
    })),
    expiringProducts: expiring.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode, expiryDate: p.expiryDate,
      daysUntilExpiry: Math.ceil((new Date(p.expiryDate) - now) / (1000 * 60 * 60 * 24)),
      currentStock: p.currentStock, category: p.category, sellingPrice: p.sellingPrice,
    })),
    expiredProducts: expired.slice(0, 10).map((p) => ({
      _id: p._id, name: p.name, productCode: p.productCode, expiryDate: p.expiryDate,
      daysExpired: Math.ceil((now - new Date(p.expiryDate)) / (1000 * 60 * 60 * 24)),
      currentStock: p.currentStock, category: p.category, sellingPrice: p.sellingPrice,
    })),
    salesAnalytics: last7Days,
    analytics: {
      salesByCategory,
      stockByCategory,
    },
  });
});

module.exports = router;
