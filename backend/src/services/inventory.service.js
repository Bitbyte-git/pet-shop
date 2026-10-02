const Product = require('../models/Product');
const InventoryTransaction = require('../models/InventoryTransaction');
const mongoose = require('mongoose');

/**
 * Core function: deduct stock and create inventory transaction.
 * Must be called within a Mongoose session for atomicity.
 */
const deductStock = async (productId, quantity, referenceType, referenceId, referenceNumber, userId, userName, session) => {
  const product = await Product.findById(productId).session(session);
  if (!product) throw { statusCode: 404, message: `Product not found: ${productId}` };
  if (product.currentStock < quantity) {
    throw { statusCode: 400, message: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${quantity}` };
  }

  const previousStock = product.currentStock;
  const newStock = previousStock - quantity;

  product.currentStock = newStock;
  await product.save({ session });

  await InventoryTransaction.create(
    [
      {
        product: productId,
        productName: product.name,
        productCode: product.productCode,
        type: referenceType === 'CLINIC_BILLING' ? 'CLINIC_USAGE' : 'SALE',
        quantity: -quantity,
        previousStock,
        newStock,
        referenceType,
        referenceId,
        referenceNumber,
        performedBy: userId,
        performedByName: userName,
      },
    ],
    { session }
  );

  return { previousStock, newStock };
};

/**
 * Add stock (for purchases)
 */
const addStock = async (productId, quantity, purchasePrice, batchNumber, expiryDate, mfgDate, purchaseId, purchaseNumber, userId, userName, session) => {
  const product = await Product.findById(productId).session(session);
  if (!product) throw { statusCode: 404, message: `Product not found: ${productId}` };

  const previousStock = product.currentStock;
  const newStock = previousStock + quantity;

  product.currentStock = newStock;
  if (batchNumber) product.batchNumber = batchNumber;
  if (expiryDate) product.expiryDate = expiryDate;
  if (mfgDate) product.manufacturingDate = mfgDate;
  if (purchasePrice) product.purchasePrice = purchasePrice;
  await product.save({ session });

  await InventoryTransaction.create(
    [
      {
        product: productId,
        productName: product.name,
        productCode: product.productCode,
        type: 'PURCHASE',
        quantity: quantity,
        previousStock,
        newStock,
        referenceType: 'PURCHASE',
        referenceId: purchaseId,
        referenceNumber: purchaseNumber,
        performedBy: userId,
        performedByName: userName,
      },
    ],
    { session }
  );

  return { previousStock, newStock };
};

/**
 * Manual stock adjustment
 */
const adjustStock = async (productId, adjustmentQty, reason, userId, userName) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw { statusCode: 404, message: 'Product not found.' };

    const previousStock = product.currentStock;
    const newStock = previousStock + adjustmentQty; // Can be negative
    if (newStock < 0) throw { statusCode: 400, message: 'Adjustment would result in negative stock.' };

    product.currentStock = newStock;
    await product.save({ session });

    await InventoryTransaction.create(
      [
        {
          product: productId,
          productName: product.name,
          productCode: product.productCode,
          type: 'ADJUSTMENT',
          quantity: adjustmentQty,
          previousStock,
          newStock,
          referenceType: 'MANUAL',
          reason,
          performedBy: userId,
          performedByName: userName,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return { product, previousStock, newStock };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getInventory = async (query = {}) => {
  const { search, category, stockStatus, page = 1, limit = 20 } = query;
  const filter = { status: 'ACTIVE' };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { productCode: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Product.countDocuments(filter),
  ]);
  let result = products.map((p) => p.toObject({ virtuals: true }));
  if (stockStatus) {
    result = result.filter((p) => p.stockStatus === stockStatus);
  }
  return { products: result, total };
};

const getTransactionHistory = async (productId, query = {}) => {
  const { page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;
  const filter = { product: productId };
  const [transactions, total] = await Promise.all([
    InventoryTransaction.find(filter)
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    InventoryTransaction.countDocuments(filter),
  ]);
  return { transactions, total };
};

module.exports = { deductStock, addStock, adjustStock, getInventory, getTransactionHistory };
