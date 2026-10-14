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
  const consultation = await Consultation.create({
    ...data,
    createdBy: userId,
    status: 'OPEN',
  });
  return consultation;
};

const updateConsultation = async (id, data, userId) => {
  const consultation = await Consultation.findByIdAndUpdate(
    id, { ...data, updatedBy: userId }, { new: true, runValidators: true }
  );
  if (!consultation) throw { statusCode: 404, message: 'Consultation not found.' };
  return consultation;
};

const completeConsultation = async (id, data, userId) => {
  const consultation = await Consultation.findByIdAndUpdate(
    id,
    {
      ...data,
      status: 'COMPLETED',
      updatedBy: userId,
    },
    { new: true, runValidators: true }
  )
    .populate('client', 'name mobile')
    .populate('pet', 'name petId');

  if (!consultation) throw { statusCode: 404, message: 'Consultation not found.' };

  // If follow-up is scheduled, update status
  if (data.followUpDate) {
    consultation.status = 'FOLLOW_UP_SCHEDULED';
    await consultation.save();
  }

  return consultation;
};

const completeFollowUp = async (id, userId) => {
  const consultation = await Consultation.findByIdAndUpdate(
    id,
    {
      followUpCompleted: true,
      followUpCompletedDate: new Date(),
      status: 'FOLLOW_UP_COMPLETED',
      updatedBy: userId,
    },
    { new: true }
  )
    .populate('client', 'name mobile')
    .populate('pet', 'name petId');

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
      .populate('consultation', 'visitDate symptoms')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Treatment.countDocuments(filter),
  ]);
  return { treatments, total };
};

const createTreatment = async (data, userId) => {
  const { consultationCharge = 0, treatmentCharge = 0, productsUsed = [] } = data;

  // Calculate product totals
  const productsTotal = productsUsed.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);

  const totalCharge = Number(consultationCharge) + Number(treatmentCharge) + productsTotal;

  const treatment = await Treatment.create({
    ...data,
    consultationCharge,
    treatmentCharge,
    totalCharge,
    createdBy: userId,
  });
  return treatment;
};

const updateTreatment = async (id, data, userId) => {
  const { consultationCharge, treatmentCharge, productsUsed } = data;

  // Recalculate totals if charges or products changed
  let updateData = { ...data, updatedBy: userId };
  if (consultationCharge !== undefined || treatmentCharge !== undefined || productsUsed) {
    const currentTreatment = await Treatment.findById(id);
    const productsTotal = (productsUsed || currentTreatment.productsUsed || []).reduce(
      (sum, p) => sum + (p.quantity * p.unitCost),
      0
    );
    updateData.totalCharge = Number(consultationCharge ?? currentTreatment.consultationCharge) +
                           Number(treatmentCharge ?? currentTreatment.treatmentCharge) +
                           productsTotal;
  }

  const treatment = await Treatment.findByIdAndUpdate(
    id, updateData, { new: true, runValidators: true }
  )
    .populate('client', 'name')
    .populate('pet', 'name');

  if (!treatment) throw { statusCode: 404, message: 'Treatment not found.' };

  // Sync follow-up with consultation if set
  if (data.followUpDate && treatment.consultation) {
    await Consultation.findByIdAndUpdate(treatment.consultation, {
      followUpDate: data.followUpDate,
      followUpReason: data.followUpReason,
      status: 'FOLLOW_UP_SCHEDULED',
    });
  }

  return treatment;
};

const completeTreatment = async (id, userId) => {
  const treatment = await Treatment.findByIdAndUpdate(
    id,
    {
      status: 'COMPLETED',
      updatedBy: userId,
    },
    { new: true }
  )
    .populate('client', 'name')
    .populate('pet', 'name')
    .populate('consultation');

  if (!treatment) throw { statusCode: 404, message: 'Treatment not found.' };

  // Mark consultation as completed if treatment is done
  if (treatment.consultation) {
    await Consultation.findByIdAndUpdate(treatment.consultation, {
      status: 'COMPLETED',
    });
  }

  return treatment;
};

// ─── CLINIC BILLING ───────────────────────────────────────────────────────────
const createClinicBilling = async (data, userId, userName) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { client, pet, consultation, items, notes } = data;

    console.log('Creating clinic billing with data:', { client, pet, consultation, items, notes });

    // Validate required fields
    if (!client) throw { statusCode: 400, message: 'Client is required.' };
    if (!pet) throw { statusCode: 400, message: 'Pet is required.' };
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw { statusCode: 400, message: 'At least one billing item is required.' };
    }

    // IMPORTANT: Clinic billing has ZERO GST
    let totalAmount = 0;
    const billingItems = [];

    for (const item of items) {
      if (!item.description) throw { statusCode: 400, message: 'Item description is required.' };
      if (!item.unitCost || item.unitCost <= 0) throw { statusCode: 400, message: 'Item unit cost must be greater than 0.' };
      if (!item.quantity || item.quantity < 1) throw { statusCode: 400, message: 'Item quantity must be at least 1.' };
      const lineTotal = item.quantity * item.unitCost;
      totalAmount += lineTotal;
      billingItems.push({ ...item, lineTotal });
    }

    const bill = await ClinicBilling.create(
      [
        {
          client: data.client,
          pet: data.pet,
          consultation: data.consultation,
          items: billingItems,
          totalAmount,
          gstAmount: 0, // ALWAYS 0 for clinic
          notes,
          createdBy: userId,
        },
      ],
      { session }
    );

    console.log('Created clinic billing:', bill[0]);

    // Deduct product stock for products used during treatment
    for (const item of items) {
      if (item.type === 'PRODUCT' && item.productRef && item.quantity > 0) {
        try {
          await deductStock(
            item.productRef,
            item.quantity,
            'CLINIC_BILLING',
            bill[0]._id,
            bill[0].clinicBillId,
            userId,
            userName,
            session
          );
        } catch (stockErr) {
          console.error('Error deducting stock:', stockErr);
          // Don't fail the entire transaction if stock deduction fails
        }
      }
    }

    await session.commitTransaction();
    return bill[0];
  } catch (err) {
    console.error('Error in createClinicBilling:', err);
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

// ─── FOLLOW-UPS ───────────────────────────────────────────────────────────────
const getFollowups = async (query = {}) => {
  const { status, page = 1, limit = 20 } = query;
  const now = new Date();

  // Fetch from Consultations
  const consultationFilter = { followUpDate: { $ne: null } };
  if (status === 'upcoming') {
    consultationFilter.followUpDate = { $gte: now };
  } else if (status === 'overdue') {
    consultationFilter.followUpDate = { $lt: now };
  } else if (status === 'pending') {
    consultationFilter.followUpDate = { $gte: now };
    consultationFilter.followUpCompleted = false;
  } else if (status === 'completed') {
    consultationFilter.followUpCompleted = true;
  }

  const consultations = await Consultation.find(consultationFilter)
    .populate('client', 'name mobile clientId address')
    .populate('pet', 'name petId species breed gender weight age')
    .populate('createdBy', 'name')
    .sort({ followUpDate: 1 });

  // Fetch from ClinicBilling
  const billingFilter = { status: 'ACTIVE', followUpDate: { $ne: null } };
  if (status === 'upcoming') {
    billingFilter.followUpDate = { $gte: now };
  } else if (status === 'overdue') {
    billingFilter.followUpDate = { $lt: now };
  } else if (status === 'pending') {
    billingFilter.followUpDate = { $gte: now };
    billingFilter.followUpContacted = false;
  } else if (status === 'completed') {
    billingFilter.followUpContacted = true;
  }

  const clinicBillings = await ClinicBilling.find(billingFilter)
    .populate('client', 'name mobile clientId address')
    .populate('pet', 'name petId species breed gender weight age')
    .populate('createdBy', 'name')
    .sort({ followUpDate: 1 });

  // Merge both sources
  const allFollowups = [
    ...consultations.map(c => ({
      _id: c._id,
      type: 'CONSULTATION',
      clinicBillId: null,
      client: c.client,
      pet: c.pet,
      followUpDate: c.followUpDate,
      nextVisitReason: c.followUpReason,
      followUpContacted: c.followUpCompleted || false,
      followUpNotes: c.notes,
      diagnosis: c.diagnosis,
      symptoms: c.symptoms,
      treatmentDetails: null,
      createdAt: c.createdAt,
      createdBy: c.createdBy,
    })),
    ...clinicBillings.map(b => ({
      _id: b._id,
      type: 'BILLING',
      clinicBillId: b.clinicBillId,
      client: b.client,
      pet: b.pet,
      followUpDate: b.followUpDate,
      nextVisitReason: b.nextVisitReason,
      followUpContacted: b.followUpContacted || false,
      followUpNotes: b.followUpNotes,
      diagnosis: b.diagnosis,
      treatmentDetails: b.treatmentDetails,
      createdAt: b.createdAt,
      createdBy: b.createdBy,
    }))
  ];

  // Sort by follow-up date
  allFollowups.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

  // Calculate days until/overdue
  const followupData = allFollowups.map(f => {
    const followUpDate = new Date(f.followUpDate);
    const diffTime = followUpDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      ...f,
      daysUntil: diffDays,
      isOverdue: diffDays < 0,
    };
  });

  // Pagination
  const skip = (page - 1) * limit;
  const paginatedFollowups = followupData.slice(skip, skip + limit);
  const total = followupData.length;

  return { followups: paginatedFollowups, total };
};

const updateFollowup = async (id, data, userId) => {
  const bill = await ClinicBilling.findByIdAndUpdate(
    id,
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  )
    .populate('client', 'name mobile')
    .populate('pet', 'name petId');

  if (!bill) throw { statusCode: 404, message: 'Follow-up record not found.' };
  return bill;
};

module.exports = {
  getConsultations, getConsultationById, createConsultation, updateConsultation,
  completeConsultation, completeFollowUp,
  getTreatments, createTreatment, updateTreatment, completeTreatment,
  createClinicBilling, getClinicBillings, getClinicBillingById,
  getFollowups, updateFollowup,
};
