const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productCode: { type: String },
    type: {
      type: String,
      enum: ['PURCHASE', 'SALE', 'CLINIC_USAGE', 'ADJUSTMENT', 'RETURN'],
      required: true,
    },
    quantity: { type: Number, required: true }, // positive = stock in, negative = stock out
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    referenceType: {
      type: String,
      enum: ['PURCHASE', 'PRODUCT_BILLING', 'CLINIC_BILLING', 'MANUAL', 'RETURN'],
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId }, // Reference to the billing/purchase doc
    referenceNumber: { type: String }, // human-readable reference
    reason: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    performedByName: { type: String },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ type: 1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
