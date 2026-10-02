const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getConsultations, getConsultationById, createConsultation, updateConsultation,
  getTreatments, createTreatment, updateTreatment,
  createClinicBilling, getClinicBillings, getClinicBillingById,
} = require('../controllers/clinic.controller');

router.use(protect);

// Consultations
router.get('/consultations', getConsultations);
router.get('/consultations/:id', getConsultationById);
router.post('/consultations', createConsultation);
router.put('/consultations/:id', updateConsultation);

// Treatments
router.get('/treatments', getTreatments);
router.post('/treatments', createTreatment);
router.put('/treatments/:id', updateTreatment);

// Clinic Billing (Internal, No GST, No Customer Invoice)
router.get('/billing', getClinicBillings);
router.get('/billing/:id', getClinicBillingById);
router.post('/billing', createClinicBilling);

module.exports = router;
