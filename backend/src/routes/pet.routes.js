const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getPets, getPetById, getPetsByOwner, createPet, updatePet, searchPets } = require('../controllers/pet.controller');

router.use(protect);

router.get('/search', searchPets);
router.get('/by-owner/:ownerId', getPetsByOwner);
router.get('/', getPets);
router.get('/:id', getPetById);
router.post('/', createPet);
router.put('/:id', updatePet);

module.exports = router;
