const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const { addStock } = require('./inventory.service');

const createPurchase = async (data, userId, userName) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { supplierId, supplierName, items, invoiceNumber, purchaseDate, notes } = data;

    let totalAmount = 0;
    const purchaseItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw { statusCode: 404, message: `Product not found: ${item.productId}` };
      if (!item.quantity || item.quantity < 1) throw { statusCode: 400, message: `Invalid quantity for ${product.name}` };
      if (!item.purchasePrice || item.purchasePrice < 0) throw { statusCode: 400, message: `Invalid price for ${product.name}` };

      const lineTotal = item.quantity * item.purchasePrice;
      totalAmount += lineTotal;

      purchaseItems.push({
        product: item.productId,
        productName: product.name,
        productCode: product.productCode,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        batchNumber: item.batchNumber,
        manufacturingDate: item.manufacturingDate,
        expiryDate: item.expiryDate,
        lineTotal,
      });
    }

    // Create purchase record
    const [purchase] = await Purchase.create(
      [
        {
          supplier: supplierId,
          supplierName,
          items: purchaseItems,
          totalAmount,
          invoiceNumber,
          purchaseDate: purchaseDate || Date.now(),
          notes,
          createdBy: userId,
        },
      ],
      { session }
    );

    // Update stock for each item
    for (const item of items) {
      await addStock(
        item.productId,
        item.quantity,
        item.purchasePrice,
        item.batchNumber,
        item.expiryDate,
        item.manufacturingDate,
        purchase._id,
        purchase.purchaseNumber,
        userId,
        userName,
        session
      );
    }

    await session.commitTransaction();
    return purchase;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getPurchases = async (query = {}) => {
  const { page = 1, limit = 20, search } = query;
  const filter = {};
  if (search) filter.purchaseNumber = { $regex: search, $options: 'i' };
  const skip = (page - 1) * limit;
  const [purchases, total] = await Promise.all([
    Purchase.find(filter)
      .populate('supplier', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Purchase.countDocuments(filter),
  ]);
  return { purchases, total };
};

const getPurchaseById = async (id) => {
  const purchase = await Purchase.findById(id)
    .populate('supplier', 'name mobile email')
    .populate('createdBy', 'name');
  if (!purchase) throw { statusCode: 404, message: 'Purchase not found.' };
  return purchase;
};

module.exports = { createPurchase, getPurchases, getPurchaseById };
