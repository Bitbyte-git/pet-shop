const productService = require('../services/product.service');

const getProducts = async (req, res) => {
  const result = await productService.getProducts(req.query);
  res.json({ success: true, ...result });
};

const getProductById = async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json({ success: true, product });
};

const createProduct = async (req, res) => {
  const product = await productService.createProduct(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Product created successfully.', product });
};

const updateProduct = async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body, req.user._id);
  res.json({ success: true, message: 'Product updated successfully.', product });
};

const getLowStockProducts = async (req, res) => {
  const products = await productService.getLowStockProducts();
  res.json({ success: true, products });
};

const getExpiringProducts = async (req, res) => {
  const days = req.query.days || 90;
  const products = await productService.getExpiringProducts(Number(days));
  res.json({ success: true, products });
};

const searchProductsForBilling = async (req, res) => {
  const products = await productService.searchProductsForBilling(req.query.q);
  res.json({ success: true, products });
};

const deleteProduct = async (req, res) => {
  const product = await productService.deleteProduct(req.params.id, req.user._id);
  res.json({ success: true, message: 'Product deleted (deactivated) successfully.', product });
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getExpiringProducts,
  searchProductsForBilling,
};
