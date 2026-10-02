const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    clientId: { type: String, unique: true }, // e.g. CL-000001
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    pincode: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    emergencyContactName: { type: String, trim: true },
    notes: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate clientId before save
clientSchema.pre('save', async function (next) {
  if (this.clientId) return next();
  const count = await mongoose.model('Client').countDocuments();
  this.clientId = `CL-${String(count + 1).padStart(6, '0')}`;
  next();
});

clientSchema.index({ name: 'text', mobile: 1 });

module.exports = mongoose.model('Client', clientSchema);
