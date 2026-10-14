const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConsultations, getConsultationById, createConsultation, updateConsultation,
  completeConsultation, completeFollowUp,
  getTreatments, createTreatment, updateTreatment, completeTreatment,
  createClinicBilling, getClinicBillings, getClinicBillingById,
  getFollowups, updateFollowup,
} = require('../controllers/clinic.controller');

router.use(protect);

// Consultations
router.get('/consultations', getConsultations);
router.get('/consultations/:id', getConsultationById);
router.post('/consultations', createConsultation);
router.put('/consultations/:id', updateConsultation);
router.patch('/consultations/:id/complete', completeConsultation);
router.patch('/consultations/:id/followup-complete', completeFollowUp);

// Treatments
router.get('/treatments', getTreatments);
router.post('/treatments', createTreatment);
router.put('/treatments/:id', updateTreatment);
router.patch('/treatments/:id/complete', completeTreatment);

// Clinic Billing (Internal, No GST, No Customer Invoice)
router.get('/billing', getClinicBillings);
router.get('/billing/:id', getClinicBillingById);
router.post('/billing', createClinicBilling);

// Follow-ups
router.get('/followups', getFollowups);
router.put('/followups/:id', updateFollowup);

module.exports = router;
