const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  purchasePrice: { type: Number, required: true, min: 0 },
  batchNumber: { type: String, trim: true },
  manufacturingDate: { type: Date },
  expiryDate: { type: Date },
  lineTotal: { type: Number, required: true },
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: { type: String, unique: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
    supplierName: { type: String },
    items: [purchaseItemSchema],
    totalAmount: { type: Number, required: true },
    invoiceNumber: { type: String, trim: true }, // Supplier's invoice number
    purchaseDate: { type: Date, default: Date.now },
    notes: { type: String },
    status: { type: String, enum: ['COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

purchaseSchema.pre('save', async function (next) {
  if (this.purchaseNumber) return next();
  const count = await mongoose.model('Purchase').countDocuments();
  const year = new Date().getFullYear();
  this.purchaseNumber = `PO-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
