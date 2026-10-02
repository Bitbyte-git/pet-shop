const petService = require('../services/pet.service');

const getPets = async (req, res) => {
  const result = await petService.getPets(req.query);
  res.json({ success: true, ...result });
};

const getPetById = async (req, res) => {
  const pet = await petService.getPetById(req.params.id);
  res.json({ success: true, pet });
};

const getPetsByOwner = async (req, res) => {
  const pets = await petService.getPetsByOwner(req.params.ownerId);
  res.json({ success: true, pets });
};

const createPet = async (req, res) => {
  const pet = await petService.createPet(req.body, req.user._id);
  res.status(201).json({ success: true, message: 'Pet created successfully.', pet });
};

const updatePet = async (req, res) => {
  const pet = await petService.updatePet(req.params.id, req.body, req.user._id);
  res.json({ success: true, message: 'Pet updated successfully.', pet });
};

const searchPets = async (req, res) => {
  const pets = await petService.searchPets(req.query.q);
  res.json({ success: true, pets });
};

module.exports = { getPets, getPetById, getPetsByOwner, createPet, updatePet, searchPets };
