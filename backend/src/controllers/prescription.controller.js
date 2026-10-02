const Prescription = require('../models/Prescription');

const getPrescriptions = async (req, res) => {
  const { client, pet, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (client) filter.client = client;
  if (pet) filter.pet = pet;
  const skip = (page - 1) * limit;
  const [prescriptions, total] = await Promise.all([
    Prescription.find(filter)
      .populate('client', 'name mobile clientId')
      .populate('pet', 'name petId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Prescription.countDocuments(filter),
  ]);
  res.json({ success: true, prescriptions, total });
};

const getPrescriptionById = async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('client', 'name mobile clientId address')
    .populate('pet', 'name petId species breed')
    .populate('consultation')
    .populate('createdBy', 'name');
  if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
  res.json({ success: true, prescription });
};

const createPrescription = async (req, res) => {
  const prescription = await Prescription.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, message: 'Prescription created.', prescription });
};

const updatePrescription = async (req, res) => {
  const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!prescription) return res.status(404).json({ success: false, message: 'Prescription not found.' });
  res.json({ success: true, prescription });
};

module.exports = { getPrescriptions, getPrescriptionById, createPrescription, updatePrescription };
