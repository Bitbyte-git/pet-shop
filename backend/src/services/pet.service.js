const Pet = require('../models/Pet');
const Client = require('../models/Client');

const getPets = async (query = {}) => {
  const { search, owner, species, page = 1, limit = 20 } = query;
  const filter = {};
  if (owner) filter.owner = owner;
  if (species) filter.species = { $regex: species, $options: 'i' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { petId: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (page - 1) * limit;
  const [pets, total] = await Promise.all([
    Pet.find(filter)
      .populate('owner', 'name mobile clientId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Pet.countDocuments(filter),
  ]);
  return { pets, total, page: Number(page), limit: Number(limit) };
};

const getPetById = async (id) => {
  const pet = await Pet.findById(id).populate('owner', 'name mobile clientId address email');
  if (!pet) throw { statusCode: 404, message: 'Pet not found.' };
  return pet;
};

const getPetsByOwner = async (ownerId) => {
  return Pet.find({ owner: ownerId, status: { $ne: 'DECEASED' } });
};

const createPet = async (data, userId) => {
  const owner = await Client.findById(data.owner);
  if (!owner) throw { statusCode: 404, message: 'Owner (client) not found.' };
  const pet = await Pet.create({ ...data, createdBy: userId });
  return pet;
};

const updatePet = async (id, data, userId) => {
  const pet = await Pet.findByIdAndUpdate(
    id,
    { ...data, updatedBy: userId },
    { new: true, runValidators: true }
  ).populate('owner', 'name mobile clientId');
  if (!pet) throw { statusCode: 404, message: 'Pet not found.' };
  return pet;
};

const searchPets = async (search) => {
  if (!search || search.length < 2) return [];
  return Pet.find({
    status: { $ne: 'DECEASED' },
    $or: [
      { name: { $regex: search, $options: 'i' } },
      { petId: { $regex: search, $options: 'i' } },
    ],
  })
    .populate('owner', 'name mobile clientId')
    .limit(10);
};

module.exports = { getPets, getPetById, getPetsByOwner, createPet, updatePet, searchPets };
