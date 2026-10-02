const clinicService = require('../services/clinic.service');

// Consultations
const getConsultations = async (req, res) => {
  const result = await clinicService.getConsultations(req.query);
  res.json({ success: true, ...result });
};
const getConsultationById = async (req, res) => {
  const consultation = await clinicService.getConsultationById(req.params.id);
  res.json({ success: true, consultation });
};
const createConsultation = async (req, res) => {
  const consultation = await clinicService.createConsultation(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Consultation created.', consultation });
};
const updateConsultation = async (req, res) => {
  const consultation = await clinicService.updateConsultation(req.params.id, req.body, req.user._id);
  res.json({ success: true, message: 'Consultation updated.', consultation });
};

// Treatments
const getTreatments = async (req, res) => {
  const result = await clinicService.getTreatments(req.query);
  res.json({ success: true, ...result });
};
const createTreatment = async (req, res) => {
  const treatment = await clinicService.createTreatment(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Treatment recorded.', treatment });
};
const updateTreatment = async (req, res) => {
  const treatment = await clinicService.updateTreatment(req.params.id, req.body, req.user._id);
  res.json({ success: true, message: 'Treatment updated.', treatment });
};

// Clinic Billing
const createClinicBilling = async (req, res) => {
  const bill = await clinicService.createClinicBilling(req.body, req.user._id, req.user.name);
  res.status(201).json({ success: true, message: 'Clinic billing record created (no GST applied).', bill });
};
const getClinicBillings = async (req, res) => {
  const result = await clinicService.getClinicBillings(req.query);
  res.json({ success: true, ...result });
};
const getClinicBillingById = async (req, res) => {
  const bill = await clinicService.getClinicBillingById(req.params.id);
  res.json({ success: true, bill });
};

module.exports = {
  getConsultations, getConsultationById, createConsultation, updateConsultation,
  getTreatments, createTreatment, updateTreatment,
  createClinicBilling, getClinicBillings, getClinicBillingById,
};
