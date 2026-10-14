const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    visitDate: { type: Date, default: Date.now, required: true },
    symptoms: { type: String, required: true }, // Main reason for visit
    diagnosis: { type: String },
    temperature: { type: Number }, // in Celsius
    weight: { type: Number }, // at time of visit, kg
    notes: { type: String },
    followUpDate: { type: Date },
    followUpReason: { type: String },
    followUpCompleted: { type: Boolean, default: false },
    followUpCompletedDate: { type: Date },
    doctor: { type: String, trim: true },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'FOLLOW_UP_SCHEDULED', 'FOLLOW_UP_COMPLETED'], default: 'OPEN' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', consultationSchema);
