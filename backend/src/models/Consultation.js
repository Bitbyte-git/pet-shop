const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    visitDate: { type: Date, default: Date.now, required: true },
    symptoms: { type: String },
    diagnosis: { type: String },
    temperature: { type: Number }, // in Celsius
    weight: { type: Number }, // at time of visit, kg
    notes: { type: String },
    followUpDate: { type: Date },
    doctor: { type: String, trim: true },
    status: { type: String, enum: ['OPEN', 'COMPLETED', 'FOLLOW_UP'], default: 'OPEN' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);
