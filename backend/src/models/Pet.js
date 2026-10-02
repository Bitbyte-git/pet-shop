const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
  vaccineName: String,
  date: Date,
  nextDueDate: Date,
  veterinarian: String,
  notes: String,
});

const petSchema = new mongoose.Schema(
  {
    petId: { type: String, unique: true }, // e.g. PET-000001
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    species: { type: String, required: true, trim: true }, // Dog, Cat, Bird, etc.
    breed: { type: String, trim: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'UNKNOWN'], default: 'UNKNOWN' },
    dateOfBirth: { type: Date },
    weight: { type: Number }, // in kg
    color: { type: String, trim: true },
    photo: { type: String }, // URL or filename
    allergies: [{ type: String }],
    existingConditions: [{ type: String }],
    currentMedication: [{ type: String }],
    medicalNotes: { type: String },
    microchipId: { type: String, trim: true },
    vaccinations: [vaccinationSchema],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'DECEASED'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for age
petSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const now = new Date();
  const dob = new Date(this.dateOfBirth);
  const diffMs = now - dob;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return months > 0 ? `${years} yr ${months} mo` : `${years} years`;
});

// Auto-generate petId
petSchema.pre('save', async function (next) {
  if (this.petId) return next();
  const count = await mongoose.model('Pet').countDocuments();
  this.petId = `PET-${String(count + 1).padStart(6, '0')}`;
  next();
});

petSchema.index({ name: 1, owner: 1 });

module.exports = mongoose.model('Pet', petSchema);
