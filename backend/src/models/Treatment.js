const mongoose = require('mongoose');

const treatmentProductSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  productCode: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitCost: { type: Number, required: true },
  lineTotal: { type: Number, required: true },
});

const treatmentSchema = new mongoose.Schema(
  {
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    treatmentName: { type: String, required: true, trim: true },
    treatmentDetails: { type: String },
    productsUsed: [treatmentProductSchema],
    consultationCharge: { type: Number, default: 0 },
    treatmentCharge: { type: Number, default: 0 },
    totalCharge: { type: Number, default: 0 },
    followUpDate: { type: Date },
    followUpReason: { type: String },
    followUpCompleted: { type: Boolean, default: false },
    followUpCompletedDate: { type: Date },
    notes: { type: String },
    status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'IN_PROGRESS' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Treatment', treatmentSchema);
