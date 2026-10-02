const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPrescriptions, getPrescriptionById, createPrescription, updatePrescription } = require('../controllers/prescription.controller');

router.use(protect);
router.get('/', getPrescriptions);
router.get('/:id', getPrescriptionById);
router.post('/', createPrescription);
router.put('/:id', updatePrescription);

module.exports = router;
