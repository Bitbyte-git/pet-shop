const mongoose = require('mongoose');
const Consultation = require('../models/Consultation');
const Treatment = require('../models/Treatment');
const ClinicBilling = require('../models/ClinicBilling');
const Product = require('../models/Product');
const { deductStock } = require('./inventory.service');

// ─── CONSULTATIONS ────────────────────────────────────────────────────────────
const getConsultations = async (query = {}) => {
  const { client, pet, status, page = 1, limit = 20 } = query;
  const filter = {};
  if (client) filter.client = client;
  if (pet) filter.pet = pet;
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [consultations, total] = await Promise.all([
    Consultation.find(filter)
      .populate('client', 'name mobile clientId')
      .populate('pet', 'name petId species breed')
      .populate('createdBy', 'name')
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Consultation.countDocuments(filter),
  ]);
  return { consultations, total };
};

const getConsultationById = async (id) => {
  const consultation = await Consultation.findById(id)
    .populate('client', 'name mobile clientId address')
    .populate('pet', 'name petId species breed gender')
    .populate('createdBy', 'name');
  if (!consultation) throw { statusCode: 404, message: 'Consultation not found.' };
  return consultation;
};

const createConsultation = async (data, userId) => {
  const consultation = await Consultation.create({ ...data, createdBy: userId });
  return consultation;
};

const updateConsultation = async (id, data, userId) => {
  const consultation = await Consultation.findByIdAndUpdate(
    id, { ...data, updatedBy: userId }, { new: true, runValidators: true }
  );
  if (!consultation) throw { statusCode: 404, message: 'Consultation not found.' };
  return consultation;
};

// ─── TREATMENTS ───────────────────────────────────────────────────────────────
const getTreatments = async (query = {}) => {
  const { consultation, pet, page = 1, limit = 20 } = query;
  const filter = {};
  if (consultation) filter.consultation = consultation;
  if (pet) filter.pet = pet;
  const skip = (page - 1) * limit;
  const [treatments, total] = await Promise.all([
    Treatment.find(filter)
      .populate('client', 'name clientId')
      .populate('pet', 'name petId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Treatment.countDocuments(filter),
  ]);
  return { treatments, total };
};

const createTreatment = async (data, userId) => {
  const treatment = await Treatment.create({ ...data, createdBy: userId });
  return treatment;
};

const updateTreatment = async (id, data, userId) => {
  const treatment = await Treatment.findByIdAndUpdate(
    id, { ...data, updatedBy: userId }, { new: true }
  );
  if (!treatment) throw { statusCode: 404, message: 'Treatment not found.' };
  return treatment;
};

// ─── CLINIC BILLING ───────────────────────────────────────────────────────────
const createClinicBilling = async (data, userId, userName) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { clientId, petId, consultationId, items, notes } = data;

    // IMPORTANT: Clinic billing has ZERO GST
    let totalAmount = 0;
    const billingItems = [];

    for (const item of items) {
      if (item.quantity < 1) throw { statusCode: 400, message: 'Item quantity must be at least 1.' };
      const lineTotal = item.quantity * item.unitCost;
      totalAmount += lineTotal;
      billingItems.push({ ...item, lineTotal });
    }

    const [bill] = await ClinicBilling.create(
      [
        {
          client: clientId,
          pet: petId,
          consultation: consultationId,
          items: billingItems,
          totalAmount,
          gstAmount: 0, // ALWAYS 0 for clinic
          notes,
          createdBy: userId,
        },
      ],
      { session }
    );

    // Deduct product stock for products used during treatment
    for (const item of items) {
      if (item.type === 'PRODUCT' && item.productRef && item.quantity > 0) {
        await deductStock(
          item.productRef,
          item.quantity,
          'CLINIC_BILLING',
          bill._id,
          bill.clinicBillId,
          userId,
          userName,
          session
        );
      }
    }

    await session.commitTransaction();
    return bill;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getClinicBillings = async (query = {}) => {
  const { client, pet, page = 1, limit = 20 } = query;
  const filter = {};
  if (client) filter.client = client;
  if (pet) filter.pet = pet;
  const skip = (page - 1) * limit;
  const [bills, total] = await Promise.all([
    ClinicBilling.find(filter)
      .populate('client', 'name mobile clientId')
      .populate('pet', 'name petId')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ClinicBilling.countDocuments(filter),
  ]);
  return { bills, total };
};

const getClinicBillingById = async (id) => {
  const bill = await ClinicBilling.findById(id)
    .populate('client', 'name mobile clientId address')
    .populate('pet', 'name petId species breed')
    .populate('consultation')
    .populate('createdBy', 'name');
  if (!bill) throw { statusCode: 404, message: 'Clinic billing record not found.' };
  return bill;
};

module.exports = {
  getConsultations, getConsultationById, createConsultation, updateConsultation,
  getTreatments, createTreatment, updateTreatment,
  createClinicBilling, getClinicBillings, getClinicBillingById,
};
