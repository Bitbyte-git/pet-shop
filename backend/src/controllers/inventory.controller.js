const inventoryService = require('../services/inventory.service');
const productService = require('../services/product.service');

const getInventory = async (req, res) => {
  const result = await inventoryService.getInventory(req.query);
  res.json({ success: true, ...result });
};

const getLowStock = async (req, res) => {
  const products = await productService.getLowStockProducts();
  res.json({ success: true, products });
};

const getExpiry = async (req, res) => {
  const days = req.query.days || 90;
  const products = await productService.getExpiringProducts(Number(days));
  res.json({ success: true, products });
};

const adjustStock = async (req, res) => {
  const { productId, quantity, reason } = req.body;
  if (!productId || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'productId and quantity are required.' });
  }
  const result = await inventoryService.adjustStock(productId, Number(quantity), reason, req.user._id, req.user.name);
  res.json({ success: true, message: 'Stock adjusted successfully.', ...result });
};

const getTransactionHistory = async (req, res) => {
  const result = await inventoryService.getTransactionHistory(req.params.productId, req.query);
  res.json({ success: true, ...result });
};

module.exports = { getInventory, getLowStock, getExpiry, adjustStock, getTransactionHistory };
