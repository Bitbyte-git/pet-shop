const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productCode: { type: String, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
    brand: { type: String, trim: true },
    description: { type: String },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },

    // Pricing
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    gstRate: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    hsnCode: { type: String, trim: true },

    // Stock
    currentStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10 },

    // Batch info (primary/latest batch)
    batchNumber: { type: String, trim: true },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },

    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
  if (this.currentStock === 0) return 'OUT_OF_STOCK';
  if (this.currentStock <= this.reorderLevel) return 'LOW_STOCK';
  return 'NORMAL';
});

// Virtual for expiry status
productSchema.virtual('expiryStatus').get(function () {
  if (!this.expiryDate) return 'NA';
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) return 'EXPIRED';
  if (daysRemaining <= 90) return 'EXPIRING_SOON';
  return 'NORMAL';
});

productSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.expiryDate) return null;
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
});

productSchema.index({ name: 'text', productCode: 1 });
productSchema.index({ category: 1 });
productSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Product', productSchema);
