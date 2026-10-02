const mongoose = require('mongoose');

const billingItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  // Snapshots - preserved even if product changes
  productNameSnapshot: { type: String, required: true },
  productCodeSnapshot: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  gstRate: { type: Number, default: 0 },
  gstAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  lineTotal: { type: Number, required: true },
});

const productBillingSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true }, // e.g. INV-2026-000001
    // Customer info
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientNameSnapshot: { type: String, required: true },
    clientMobileSnapshot: { type: String },
    clientAddressSnapshot: { type: String },
    // Walk-in customer details
    walkInName: { type: String },
    walkInMobile: { type: String },
    isWalkIn: { type: Boolean, default: false },
    // Pet info (optional)
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    petNameSnapshot: { type: String },
    petIdSnapshot: { type: String },

    items: [billingItemSchema],

    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
      default: 'PENDING',
    },
    paymentReference: { type: String, trim: true },
    paidAmount: { type: Number },
    changeAmount: { type: Number, default: 0 },

    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String },
  },
  { timestamps: true }
);

// Auto-generate invoice number
productBillingSchema.pre('save', async function (next) {
  if (this.invoiceNumber) return next();
  const count = await mongoose.model('ProductBilling').countDocuments();
  const year = new Date().getFullYear();
  this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

productBillingSchema.index({ invoiceNumber: 1 });
productBillingSchema.index({ client: 1 });
productBillingSchema.index({ createdAt: -1 });
productBillingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('ProductBilling', productBillingSchema);
