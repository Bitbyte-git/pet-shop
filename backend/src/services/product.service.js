const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

const getProducts = async (query = {}) => {
  const { search, category, status, stockStatus, page = 1, limit = 20 } = query;
  const filter = {};
  if (status) filter.status = status;
  else filter.status = 'ACTIVE';
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { productCode: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name prefix')
      .populate('supplier', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);
  return { products, total, page: Number(page), limit: Number(limit) };
};

const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('category', 'name prefix')
    .populate('supplier', 'name mobile email');
  if (!product) throw { statusCode: 404, message: 'Product not found.' };
  return product;
};

const generateProductCode = async (categoryId) => {
  const category = await ProductCategory.findById(categoryId);
  const prefix = category?.prefix || 'PRD';
  const count = await Product.countDocuments({ category: categoryId });
  return `${prefix}-${String(count + 1).padStart(6, '0')}`;
};

const createProduct = async (data, userId) => {
  // Check duplicate product code
  if (data.productCode) {
    const existing = await Product.findOne({ productCode: data.productCode.toUpperCase() });
    if (existing) throw { statusCode: 400, message: 'Product code already exists.' };
  } else {
    data.productCode = await generateProductCode(data.category);
  }

  const product = await Product.create({ ...data, createdBy: userId });
  return Product.findById(product._id).populate('category', 'name prefix').populate('supplier', 'name');
};

const updateProduct = async (id, data, userId) => {
  if (data.productCode) {
    const existing = await Product.findOne({ productCode: data.productCode.toUpperCase(), _id: { $ne: id } });
    if (existing) throw { statusCode: 400, message: 'Product code already exists.' };
  }
  const product = await Product.findByIdAndUpdate(
    id,
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  ).populate('category', 'name prefix').populate('supplier', 'name');
  if (!product) throw { statusCode: 404, message: 'Product not found.' };
  return product;
};

const getLowStockProducts = async () => {
  const products = await Product.find({ status: 'ACTIVE' }).populate('category', 'name');
  return products.filter((p) => p.currentStock <= p.reorderLevel);
};

const getExpiringProducts = async (days = 90) => {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return Product.find({
    status: 'ACTIVE',
    expiryDate: { $lte: future },
  }).populate('category', 'name');
};

const searchProductsForBilling = async (search) => {
  const filter = { status: 'ACTIVE' };
  if (search && search.trim().length > 0) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { productCode: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
    ];
  }
  const products = await Product.find(filter)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(25);
  return products.map((p) => p.toObject({ virtuals: true }));
};

const deleteProduct = async (id, userId) => {
  const product = await Product.findByIdAndUpdate(
    id,
    { status: 'INACTIVE', updatedBy: userId },
    { new: true }
  );
  if (!product) throw { statusCode: 404, message: 'Product not found.' };
  return product;
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
