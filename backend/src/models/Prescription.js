const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  medicineName: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String }, // e.g., "2 times a day"
  duration: { type: String }, // e.g., "7 days"
  instructions: { type: String },
});

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: { type: String, unique: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    doctor: { type: String, trim: true },
    items: [prescriptionItemSchema],
    notes: { type: String },
    validUntil: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'DISPENSED', 'EXPIRED'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

prescriptionSchema.pre('save', async function (next) {
  if (this.prescriptionNumber) return next();
  const count = await mongoose.model('Prescription').countDocuments();
  const year = new Date().getFullYear();
  this.prescriptionNumber = `RX-${year}-${String(count + 1).padStart(6, '0')}`;
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
