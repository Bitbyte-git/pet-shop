const mongoose = require('mongoose');

const clinicBillingItemSchema = new mongoose.Schema({
  type: { type: String, enum: ['CONSULTATION', 'TREATMENT', 'EQUIPMENT', 'PRODUCT'], required: true },
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitCost: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
  productRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
});

const clinicBillingSchema = new mongoose.Schema(
  {
    clinicBillId: { type: String, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    items: [clinicBillingItemSchema],
    totalAmount: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 }, // Always 0 for clinic
    notes: { type: String },
    status: { type: String, enum: ['ACTIVE', 'CANCELLED'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

clinicBillingSchema.pre('save', async function (next) {
  if (this.clinicBillId) return next();
  const count = await mongoose.model('ClinicBilling').countDocuments();
  const year = new Date().getFullYear();
  this.clinicBillId = `CLN-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

module.exports = mongoose.model('ClinicBilling', clinicBillingSchema);
